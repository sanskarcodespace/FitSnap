import { jwtVerify, SignJWT } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-fallback-key-do-not-use-in-prod")

export interface SessionPayload {
  userId: string
  role: string
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch (error) {
    return null
  }
}
