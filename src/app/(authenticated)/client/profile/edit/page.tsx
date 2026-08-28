import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { ClientLayout } from "@/components/layout/client-layout"
import { EditProfileForm } from "./EditProfileForm"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function ClientEditProfilePage() {
  const token = cookies().get("session_token")?.value
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
    <ClientLayout 
      header={
        <div className="flex items-center gap-3 w-full">
          <Link href="/client" className="text-[var(--color-neutral-600)] hover:text-black">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="font-bold text-lg">Edit Profile</div>
        </div>
      }
      bottomNav={<div />}
    >
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-neutral-200)]">
        <EditProfileForm profile={profile} />
      </div>
    </ClientLayout>
  )
}
