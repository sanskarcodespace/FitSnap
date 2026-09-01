import { jwtVerify, SignJWT } from "jose"
import prisma from "@/lib/db/prisma"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-fallback-key-do-not-use-in-prod")

export interface SessionPayload {
  userId: string
  role: string
  sessionId?: string
}

export async function signToken(
  payload: SessionPayload,
  userAgent?: string,
  ipAddressPartial?: string
): Promise<string> {
  // Create a DB session
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  const dbSession = await prisma.session.create({
    data: {
      userId: payload.userId,
      userAgent: userAgent || null,
      ipAddressPartial: ipAddressPartial || null,
      expiresAt,
    }
  })

  return await new SignJWT({ ...payload, sessionId: dbSession.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const sessionPayload = payload as unknown as SessionPayload
    
    if (sessionPayload.sessionId) {
      const dbSession = await prisma.session.findUnique({
        where: { id: sessionPayload.sessionId }
      })
      
      if (!dbSession || dbSession.revokedAt || dbSession.expiresAt < new Date()) {
        return null // Session revoked or expired in DB
      }
      
      // Update lastActiveAt periodically (e.g. if older than 5 minutes to avoid hitting DB every request)
      if (Date.now() - dbSession.lastActiveAt.getTime() > 5 * 60 * 1000) {
        await prisma.session.update({
          where: { id: dbSession.id },
          data: { lastActiveAt: new Date() }
        }).catch(() => {}) // Ignore update errors to not fail verification
      }
    }
    
    return sessionPayload
  } catch (error: any) {
    if (error?.message?.includes("PrismaClient is not configured to run in Edge Runtime")) {
      // In Edge runtime (like middleware), we can't use Prisma to hit the DB.
      // We'll trust the JWT signature and expiration, and return the payload.
      // The actual DB validation can happen in Node.js Server Components if needed.
      const { payload } = await jwtVerify(token, SECRET).catch(() => ({ payload: null }))
      if (payload) {
        return payload as unknown as SessionPayload
      }
    }
    console.error("JWT Verification Error:", error)
    return null
  }
}

