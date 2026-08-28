import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { ClientOnboardingForm } from "./ClientOnboardingForm"

export default async function ClientOnboardingPage() {
  const token = cookies().get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/coach")
  
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId }
  })
  
  if (profile?.onboardingCompleted) {
    redirect("/client")
  }
  
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-[var(--color-neutral-200)] overflow-hidden">
        <div className="p-6 bg-[var(--color-primary-50)] border-b border-[var(--color-neutral-200)]">
          <h1 className="text-[var(--text-h3-size)] font-bold text-center">Welcome to FitSnap</h1>
          <p className="text-center text-[var(--color-neutral-600)] text-[var(--text-body-sm-size)] mt-1">Let's build your profile.</p>
        </div>
        <div className="p-6">
          <ClientOnboardingForm initialData={profile || {}} />
        </div>
      </div>
    </div>
  )
}
