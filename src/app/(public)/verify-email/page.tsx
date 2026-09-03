import { verifyAndConsumeToken } from "@/lib/auth/tokens"
import prisma from "@/lib/db/prisma"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Email",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-6">No verification token was provided.</p>
          <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
        </div>
      </div>
    )
  }

  try {
    const { userId, newEmail } = await verifyAndConsumeToken(token)

    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: true }
    })

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">Email Verified</h1>
          <p className="text-gray-600 mb-6">Your email address has been successfully updated to {newEmail}.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Log In</Link>
        </div>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error.message || "The verification link is invalid or has expired."}</p>
          <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
        </div>
      </div>
    )
  }
}
