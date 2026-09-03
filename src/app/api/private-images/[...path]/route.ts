import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const stat = promisify(fs.stat)

let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  try {
    const token = (await cookies()).get("session_token")?.value
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const session = await verifyToken(token)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const [folder, clientId, filename] = params.path

    if (folder !== "food" && folder !== "temp" && folder !== "progress") {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Access control check
    let authorized = session.userId === clientId

    if (!authorized && session.role === "COACH") {
      const connection = await prisma.coachClientConnection.findFirst({
        where: {
          coachId: session.userId,
          clientId: clientId,
          status: "ACTIVE"
        }
      })
      if (connection) {
        authorized = true
      }
    }

    if (!authorized) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    if (!clientId.match(/^[a-zA-Z0-9_-]+$/) || !filename.match(/^[a-zA-Z0-9_.-]+$/)) {
        return new NextResponse("Invalid request", { status: 400 })
    }

    const storageDriver = process.env.STORAGE_DRIVER || "local";
    const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg"

    if (storageDriver === "s3") {
      try {
        const s3 = getS3Client();
        const bucket = process.env.AWS_S3_BUCKET_NAME || "fitsnap-prod-assets";
        
        // Match the prefix structure in upload.ts: private/${folder}/${filename}
        // Wait, upload.ts appends ${filename}, and here we have [folder, clientId, filename].
        // In the local code: private/uploads/${folder}/${clientId}/${filename}
        // Let's adjust S3 key to match what the upload generates or just use the params directly.
        // The original S3 upload.ts doesn't have clientId in the path. It just had folder and filename.
        // Wait, in `src/app/api/private-images/[...path]/route.ts` we have folder, clientId, filename.
        // Let's just pass the full path back into S3.
        const key = `private/${folder}/${clientId}/${filename}`;

        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });

        const data = await s3.send(command);
        
        return new NextResponse(data.Body as any, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=86400",
            ...(data.ContentLength ? { "Content-Length": data.ContentLength.toString() } : {})
          }
        });
      } catch (e) {
        console.error("S3 GetObject error:", e)
        return new NextResponse("File Not Found", { status: 404 })
      }
    } else {
      const filePath = path.join(process.cwd(), "private", "uploads", folder, clientId, filename)
      try {
        const fileStat = await stat(filePath)
        const fileStream = fs.createReadStream(filePath)
        
        return new NextResponse(fileStream as any, {
          headers: {
            "Content-Type": contentType,
            "Content-Length": fileStat.size.toString(),
            "Cache-Control": "private, max-age=86400",
          },
        })
      } catch (e) {
        return new NextResponse("File Not Found", { status: 404 })
      }
    }
  } catch (error) {
    console.error("Error serving private image:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
