import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const stat = promisify(fs.stat)

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

    if (folder !== "food" && folder !== "temp") {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Access control check
    // If the requester is not the client, check if they are a coach with an active connection to the client
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

    // Securely construct file path
    // Ensure no directory traversal (sanitize inputs)
    if (!clientId.match(/^[a-zA-Z0-9_-]+$/) || !filename.match(/^[a-zA-Z0-9_.-]+$/)) {
        return new NextResponse("Invalid request", { status: 400 })
    }

    const filePath = path.join(process.cwd(), "private", "uploads", folder, clientId, filename)

    try {
      const fileStat = await stat(filePath)
      
      const fileStream = fs.createReadStream(filePath)
      
      // Determine content type (sharp output is always JPEG per our config)
      const contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg"
      
      return new NextResponse(fileStream as any, {
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileStat.size.toString(),
          "Cache-Control": "private, max-age=86400", // cache for a day securely
        },
      })
    } catch (e) {
      return new NextResponse("File Not Found", { status: 404 })
    }
  } catch (error) {
    console.error("Error serving private image:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
