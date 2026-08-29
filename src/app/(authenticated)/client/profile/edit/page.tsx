import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { ClientLayout } from "@/components/layout/client-layout"
import { EditProfileForm } from "./EditProfileForm"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function ClientEditProfilePage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/coach")

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId }
  })

  if (!profile?.onboardingCompleted) {
    redirect("/client/onboarding")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-[var(--color-neutral-200)]">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Edit Profile
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Update your personal details and goals.
        </p>
      </div>
      <EditProfileForm profile={profile} />
    </div>
  )
}
