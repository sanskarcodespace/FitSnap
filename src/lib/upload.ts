import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

export interface UploadOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  folder?: string
  private?: boolean
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

    // Ensure directory exists
    const baseDir = isPrivate ? path.join(process.cwd(), "private", "uploads") : path.join(process.cwd(), "public", "uploads")
    const uploadDir = path.join(baseDir, folder)
    await fs.mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const hash = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const filename = `${hash}.jpg`
    const thumbFilename = `${hash}-thumb.jpg`
    const filePath = path.join(uploadDir, filename)
    const thumbFilePath = path.join(uploadDir, thumbFilename)

    // Write primary file
    await fs.writeFile(filePath, processedBuffer)

    // Generate and write thumbnail
    const thumbBuffer = await sharp(processedBuffer)
      .resize(200, 200, {
        fit: "cover"
      })
      .jpeg({ quality: 60 })
      .toBuffer()

    await fs.writeFile(thumbFilePath, thumbBuffer)

    // Return the URL path
    return isPrivate ? `/api/private-images/${folder}/${filename}` : `/uploads/${folder}/${filename}`
  } catch (error) {
    console.error("Image processing error:", error)
    throw new Error("Failed to process image. The file may be corrupted or not a valid image.")
  }
}

