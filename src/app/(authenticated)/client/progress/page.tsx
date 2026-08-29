import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"

export default async function ClientProgressPage() {
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-[var(--color-neutral-200)]">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Progress
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Your starting baseline and current goals.
        </p>
      </div>

      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)]">
        <div className="flex justify-between items-start mb-6">
          <h2 className="font-bold text-[var(--text-h3-size)] text-[var(--color-neutral-800)]">Primary Goal</h2>
          <span className="bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] text-xs font-semibold px-3 py-1.5 rounded-full">
            {profile.goal}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
            <p className="text-xs text-[var(--color-neutral-500)] mb-1">Starting Weight</p>
            <p className="font-bold text-xl">{profile.currentWeight} {profile.preferredWeightUnit}</p>
          </div>
          <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
            <p className="text-xs text-[var(--color-neutral-500)] mb-1">Target Weight</p>
            <p className="font-bold text-xl">{profile.targetWeight ? `${profile.targetWeight} ${profile.preferredWeightUnit}` : "-"}</p>
          </div>
          <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
            <p className="text-xs text-[var(--color-neutral-500)] mb-1">Height</p>
            <p className="font-bold text-xl">{profile.height ? `${profile.height} cm` : "-"}</p>
          </div>
          <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
            <p className="text-xs text-[var(--color-neutral-500)] mb-1">Target Date</p>
            <p className="font-bold text-xl">
              {profile.targetDate 
                ? new Date(profile.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
                : "-"
              }
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-secondary-50)] text-[var(--color-secondary-500)] flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>
        <h3 className="text-[var(--text-h4-size)] font-bold text-[var(--color-neutral-800)] mb-1">Weight History Tracking</h3>
        <p className="text-sm text-[var(--color-neutral-500)] max-w-md">
          Charts and regular weight log tracking are coming soon. For now, we've saved your starting weight and goal targets.
        </p>
      </section>
    </div>
  )
}
