import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { ClientLayout } from "@/components/layout/client-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ClientHomePage() {
  const token = cookies().get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/coach")

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    include: { user: true }
  })

  if (!profile?.onboardingCompleted) {
    redirect("/client/onboarding")
  }

  // Fetch active coach connection
  const activeConnection = await prisma.coachClientConnection.findFirst({
    where: {
      clientEmail: profile.user.email,
      status: "ACTIVE"
    },
    include: {
      coach: {
        include: { user: true }
      }
    }
  })

  return (
    <ClientLayout 
      header={<div className="font-bold text-lg">My Dashboard</div>}
      bottomNav={<div className="text-sm text-center text-[var(--color-neutral-500)] py-2 border-t">Navigation coming soon</div>}
    >
      <div className="space-y-6">
        {/* Profile Card */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-neutral-200)] flex items-center gap-4">
          {profile.profilePhoto ? (
            <img src={profile.profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-[var(--color-neutral-400)] text-xs">
              No Photo
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-[var(--text-h3-size)]">{profile.user.name || "Client"}</h2>
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)]">{profile.goal}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/client/profile/edit">Edit</Link>
          </Button>
        </section>

        {/* Coach Section */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-neutral-200)]">
          <h3 className="font-bold mb-3 border-b border-[var(--color-neutral-100)] pb-2 text-[var(--color-neutral-700)]">Your Coach</h3>
          {activeConnection && activeConnection.coach ? (
            <div className="flex items-center gap-3">
              {activeConnection.coach.profilePhoto ? (
                <img src={activeConnection.coach.profilePhoto} alt="Coach" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-[var(--color-neutral-400)] text-xs">
                  No Photo
                </div>
              )}
              <div>
                <p className="font-medium">{activeConnection.coach.businessName || activeConnection.coach.user.name || "Your Coach"}</p>
                <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">Connected</p>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">
              You are not currently connected to a coach. Check your email for an invitation link if you are expecting one.
            </p>
          )}
        </section>

        {/* Quick Stats Placeholder */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-neutral-200)]">
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">Current Weight</p>
            <p className="font-bold text-xl">{profile.currentWeight} {profile.preferredWeightUnit}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-neutral-200)]">
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">Target</p>
            <p className="font-bold text-xl">{profile.targetWeight ? `${profile.targetWeight} ${profile.preferredWeightUnit}` : "-"}</p>
          </div>
        </section>
      </div>
    </ClientLayout>
  )
}
