import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getDailyNutritionSummary } from "@/lib/data/nutrition"
import { ProgressRing, ProgressBar } from "@/components/ui/progress"
import { DashboardCheckinCard } from "../client/DashboardCheckinCard"
import { AssistantCard } from "@/components/dashboard/AssistantCard"
import { Share2, TrendingUp, FileText, Utensils } from "lucide-react"

export default async function IndividualHomePage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "INDIVIDUAL") redirect("/login")

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    include: { user: true }
  })

  if (!profile?.onboardingCompleted) {
    redirect("/individual/onboarding")
  }

  // Format today's date
  const todayDateObj = new Date()
  const tzOffset = todayDateObj.getTimezoneOffset() * 60000;
  const todayStr = new Date(todayDateObj.getTime() - tzOffset).toISOString().split('T')[0]

  // Fetch today's checkin
  const todayCheckIn = await prisma.dailyCheckIn.findUnique({
    where: {
      clientId_date: {
        clientId: session.userId,
        date: todayStr
      }
    }
  })

  // Get first name for greeting from email
  const firstName = profile.user.email.split("@")[0] || "User"
  
  const todayFormatted = todayDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  // Fetch today's summary
  const summary = await getDailyNutritionSummary(session.userId, todayStr)

  // Fetch most recent weight entry
  const mostRecentWeight = await prisma.weightEntry.findFirst({
    where: { clientId: session.userId },
    orderBy: { date: 'desc' }
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Greeting Header */}
      <div className="pb-2">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Hi, {firstName}
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          {todayFormatted}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Progress Card */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--color-primary-600)]" />
              Progress
            </h2>
            <span className="bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] text-xs font-semibold px-2 py-1 rounded-full">
              {profile.goal}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)]">
              <p className="text-xs text-[var(--color-neutral-500)] mb-1">Current Weight</p>
              <p className="font-bold text-lg">{mostRecentWeight?.weightValue ?? profile.currentWeight} {profile.preferredWeightUnit}</p>
            </div>
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)]">
              <p className="text-xs text-[var(--color-neutral-500)] mb-1">Target</p>
              <p className="font-bold text-lg">{profile.targetWeight ? `${profile.targetWeight} ${profile.preferredWeightUnit}` : "-"}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="w-1/2" asChild>
              <Link href="/individual/progress">View Progress</Link>
            </Button>
            <Button variant="secondary" className="w-1/2" asChild>
              <Link href="/individual/progress">Log Weight</Link>
            </Button>
          </div>
        </section>

        {/* Share My Progress Card */}
        <section className="bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-secondary-50)] rounded-xl p-5 shadow-sm border border-[var(--color-primary-200)] flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
            <Share2 className="w-6 h-6 text-[var(--color-primary-600)]" />
          </div>
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-primary-900)] mb-2">Share Progress</h2>
          <p className="text-sm text-[var(--color-primary-700)] mb-4">
            Share your achievements with friends, family, or on social media.
          </p>
          <Button variant="default" className="w-full" asChild>
            <Link href="/individual/share">Share My Progress</Link>
          </Button>
        </section>

        {/* Food & Nutrition Card */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col">
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)] mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[var(--color-secondary-600)]" />
            Food & Nutrition
          </h2>
          {summary.meals.length === 0 && summary.waterEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-secondary-50)] text-[var(--color-secondary-500)] flex items-center justify-center mb-3">
                <Utensils className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[var(--color-neutral-700)] mb-1">Nothing logged yet</p>
              <p className="text-xs text-[var(--color-neutral-500)] mb-4">Log your first meal or water today.</p>
              <Button asChild>
                <Link href="/individual/food">Log Food or Water</Link>
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {summary.hasTarget ? (
                <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                  <div className="flex flex-col items-center justify-center border border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)] rounded-lg p-3">
                    <p className="text-xs text-[var(--color-neutral-500)] mb-2">Calories</p>
                    <ProgressRing 
                      value={summary.consumedTotals.calories} 
                      max={summary.targets!.calories} 
                      size={80}
                      strokeWidth={8}
                      indicatorColor="text-[var(--color-macro-calories)]"
                    />
                    <p className="text-xs font-bold mt-2">{summary.consumedTotals.calories} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.calories}</span></p>
                  </div>
                  <div className="flex flex-col justify-center border border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)] rounded-lg p-3">
                    <p className="text-xs text-[var(--color-neutral-500)] mb-2">Water</p>
                    <div className="mb-1 text-sm font-bold text-center">
                      {(summary.consumedTotals.waterMl / 1000).toFixed(1)} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.waterLiters.toFixed(1)} L</span>
                    </div>
                    <ProgressBar 
                      value={summary.consumedTotals.waterMl / 1000} 
                      max={summary.targets!.waterLiters} 
                      indicatorColor="bg-[var(--color-macro-water)]" 
                    />
                    <div className="mt-3">
                       <p className="text-[10px] text-[var(--color-neutral-500)] mb-1">Pro: {summary.consumedTotals.protein}/{summary.targets!.protein}g</p>
                       <p className="text-[10px] text-[var(--color-neutral-500)] mb-1">Carb: {summary.consumedTotals.carbs}/{summary.targets!.carbs}g</p>
                       <p className="text-[10px] text-[var(--color-neutral-500)]">Fat: {summary.consumedTotals.fat}/{summary.targets!.fat}g</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                  <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)] flex flex-col justify-center">
                    <p className="text-xs text-[var(--color-neutral-500)] mb-1">Calories Logged</p>
                    <p className="font-bold text-lg text-[var(--color-neutral-800)]">{summary.consumedTotals.calories} kcal</p>
                  </div>
                  <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)] flex flex-col justify-center">
                    <p className="text-xs text-[var(--color-neutral-500)] mb-1">Water Logged</p>
                    <p className="font-bold text-lg text-[var(--color-primary-700)]">{summary.consumedTotals.waterMl} ml</p>
                  </div>
                </div>
              )}
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/individual/food">View Details & Log</Link>
              </Button>
            </div>
          )}
        </section>



        {/* Nutrition Assistant Card */}
        <section className="col-span-full md:col-span-1">
          <AssistantCard />
        </section>

        {/* Check-ins Card */}
        <DashboardCheckinCard todayCheckIn={todayCheckIn} basePath="/individual" />
      </div>
    </div>
  )
}
