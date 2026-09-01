import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeightTab } from "../../client/progress/WeightTab"
import { BodyMeasurementsTab } from "../../client/progress/BodyMeasurementsTab"

export default async function IndividualProgressPage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "INDIVIDUAL") redirect("/login")

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId }
  })

  if (!profile?.onboardingCompleted) {
    redirect("/individual/onboarding")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-[var(--color-neutral-200)]">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Progress
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Track your weight and body measurements over time.
        </p>
      </div>

      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)]">
        <div className="flex justify-between items-start mb-6">
          <h2 className="font-bold text-[var(--text-h3-size)] text-[var(--color-neutral-800)]">Goals & Baseline</h2>
          <span className="bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] text-xs font-semibold px-3 py-1.5 rounded-full">
            {profile.goal}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
            <p className="text-xs text-[var(--color-neutral-500)] mb-1">Target Weight</p>
            <p className="font-bold text-xl">{profile.targetWeight ? `${profile.targetWeight} ${profile.preferredWeightUnit}` : "-"}</p>
          </div>
          <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
            <p className="text-xs text-[var(--color-neutral-500)] mb-1">Starting Weight</p>
            <p className="font-bold text-xl">{profile.currentWeight} {profile.preferredWeightUnit}</p>
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

      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="mb-6 bg-white border border-[var(--color-neutral-200)] shadow-sm">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="measurements">Body Measurements</TabsTrigger>
        </TabsList>
        <TabsContent value="weight">
          <WeightTab />
        </TabsContent>
        <TabsContent value="measurements">
          <BodyMeasurementsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
