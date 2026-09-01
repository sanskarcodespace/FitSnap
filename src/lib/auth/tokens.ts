import crypto from "crypto"
import prisma from "@/lib/db/prisma"

const TOKEN_EXPIRY_HOURS = 24

export async function createVerificationToken(userId: string, email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  // Invalidate any existing tokens for this user/email combo
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
    }
  })

  await prisma.verificationToken.create({
    data: {
      userId,
      email,
      token,
      expiresAt,
    }
  })

  return token
}

export async function verifyAndConsumeToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!record) {
    throw new Error("Invalid token")
  }

  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } })
    throw new Error("Token has expired")
  }

  // Consume token
  await prisma.verificationToken.delete({ where: { id: record.id } })

  return {
    userId: record.userId,
    newEmail: record.email,
  }
}
