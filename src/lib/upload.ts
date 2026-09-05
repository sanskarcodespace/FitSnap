import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export interface UploadOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  folder?: string
  private?: boolean
}

// Lazy-load S3 client to avoid crash if env vars are missing and driver is local
let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      forcePathStyle: true, // required for Neon Object Storage
      region: process.env.AWS_REGION || "us-east-1",
      endpoint: process.env.AWS_ENDPOINT_URL_S3 || undefined, // auto-picks up Neon endpoint if available
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

export async function processAndStoreImage(file: File, options: UploadOptions = {}): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 80,
    folder = "profiles",
    private: isPrivate = false
  } = options

  // Validate it's an image by MIME type initially
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Only images are allowed.")
  }

  // Enforce Max Size (e.g. 5MB limit before sharp processing)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds the 5MB limit.")
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    // Process with sharp (this actually validates content is a real image)
    const processedBuffer = await sharp(buffer)
      .rotate() // auto-rotates based on EXIF before stripping
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality }) // convert everything to a reasonable JPEG for consistent storage
      
      .toBuffer()

    const thumbBuffer = await sharp(processedBuffer)
      .resize(200, 200, {
        fit: "cover"
      })
      .jpeg({ quality: 60 })
      .toBuffer()

    const hash = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const filename = `${hash}.jpg`
    const thumbFilename = `${hash}-thumb.jpg`

    const storageDriver = process.env.STORAGE_DRIVER || "local";

    if (storageDriver === "s3") {
      const s3 = getS3Client();
      const bucket = process.env.AWS_S3_BUCKET_NAME || "fitsnap-prod-assets";
      
      const s3Prefix = isPrivate ? `private/${folder}` : `public/${folder}`;
      
      // Upload primary
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: `${s3Prefix}/${filename}`,
        Body: processedBuffer,
        ContentType: "image/jpeg",
        // Do NOT make private uploads public
        ACL: isPrivate ? "private" : "public-read"
      }));

      // Upload thumbnail
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: `${s3Prefix}/${thumbFilename}`,
        Body: thumbBuffer,
        ContentType: "image/jpeg",
        ACL: isPrivate ? "private" : "public-read"
      }));

      const publicUrl = process.env.AWS_ENDPOINT_URL_S3 
        ? `${process.env.AWS_ENDPOINT_URL_S3}/${bucket}/${s3Prefix}/${filename}`
        : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Prefix}/${filename}`;

      return isPrivate ? `/api/private-images/${folder}/${filename}` : publicUrl;
    } else {
      // Local storage fallback
      // Ensure directory exists
      const baseDir = isPrivate ? path.join(process.cwd(), "private", "uploads") : path.join(process.cwd(), "public", "uploads")
      const uploadDir = path.join(baseDir, folder)
      await fs.mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, filename)
      const thumbFilePath = path.join(uploadDir, thumbFilename)

      await fs.writeFile(filePath, processedBuffer)
      await fs.writeFile(thumbFilePath, thumbBuffer)

      return isPrivate ? `/api/private-images/${folder}/${filename}` : `/uploads/${folder}/${filename}`
    }
  } catch (error) {
    console.error("Image processing error:", error)
    throw new Error("Failed to process image. The file may be corrupted or not a valid image.")
  }
}

import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

export async function moveImage(oldPathRef: string, newFolder: string, clientId: string): Promise<string | null> {
  // e.g., oldPathRef = "/api/private-images/temp/client_id/123.jpg"
  // e.g., newFolder = "food"
  
  const filename = oldPathRef.split("/").pop()
  if (!filename || !filename.match(/^[a-zA-Z0-9_.-]+$/)) return null

  const storageDriver = process.env.STORAGE_DRIVER || "local"
  
  if (storageDriver === "s3") {
    try {
      const s3 = getS3Client()
      const bucket = process.env.AWS_S3_BUCKET_NAME || "fitsnap-prod-assets"
      
      const oldPrefixFolder = oldPathRef.includes("temp") ? "temp" : "profiles"
      const oldKey = `private/${oldPrefixFolder}/${clientId}/${filename}`
      const newKey = `private/${newFolder}/${clientId}/${filename}`
      
      await s3.send(new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${oldKey}`,
        Key: newKey,
      }))
      
      await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: oldKey,
      }))

      // Return the new URL path
      return `/api/private-images/${newFolder}/${clientId}/${filename}`
    } catch (err) {
      console.error("S3 Move error", err)
      return null
    }
  } else {
    // Local fallback
    const tempDir = path.join(process.cwd(), "private", "uploads", "temp", clientId)
    const finalDir = path.join(process.cwd(), "private", "uploads", newFolder, clientId)
    const oldFilePath = path.join(tempDir, filename)
    const newFilePath = path.join(finalDir, filename)

    try {
      await fs.mkdir(finalDir, { recursive: true })
      await fs.rename(oldFilePath, newFilePath)
      return `/api/private-images/${newFolder}/${clientId}/${filename}`
    } catch (e) {
      console.error("Local move error", e)
      return null
    }
  }
}

export async function deleteImage(pathRef: string, clientId: string): Promise<void> {
  const filename = pathRef.split("/").pop()
  if (!filename || !filename.match(/^[a-zA-Z0-9_.-]+$/)) return

  const folderMatch = pathRef.match(/\/api\/private-images\/([^/]+)\//)
  const folder = folderMatch ? folderMatch[1] : "food"

  const storageDriver = process.env.STORAGE_DRIVER || "local"

  if (storageDriver === "s3") {
    try {
      const s3 = getS3Client()
      const bucket = process.env.AWS_S3_BUCKET_NAME || "fitsnap-prod-assets"
      
      await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: `private/${folder}/${clientId}/${filename}`,
      }))
    } catch (e) {
      console.error("S3 delete error", e)
    }
  } else {
    const filePath = path.join(process.cwd(), "private", "uploads", folder, clientId, filename)
    try {
      await fs.unlink(filePath)
    } catch (e) {}
  }
}

