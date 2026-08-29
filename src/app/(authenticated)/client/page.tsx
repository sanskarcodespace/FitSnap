import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getDailyNutritionSummary } from "@/lib/data/nutrition"
import { ProgressRing, ProgressBar } from "@/components/ui/progress"
import { DashboardHabitsCard } from "./DashboardHabitsCard"
import { DashboardCheckinCard } from "./DashboardCheckinCard"

export default async function ClientHomePage() {
  const token = (await cookies()).get("session_token")?.value
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
      invitedEmail: profile.user.email,
      status: "ACTIVE"
    },
    include: {
      coach: {
        include: { coachProfile: true }
      },
      dietPlans: {
        orderBy: { createdAt: 'desc' }
      },
      workoutPlans: {
        orderBy: { createdAt: 'desc' }
      },
      yogaPlans: {
        orderBy: { createdAt: 'desc' }
      },
      habitPlans: {
        where: { status: "ACTIVE" },
        include: {
          items: {
            where: { status: "active" },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }
    }
  })

  const activeHabitPlan = activeConnection?.habitPlans[0] || null;

  // Format today's date
  const todayDateObj = new Date()
  const tzOffset = todayDateObj.getTimezoneOffset() * 60000;
  const todayStr = new Date(todayDateObj.getTime() - tzOffset).toISOString().split('T')[0]

  // Fetch today's habit completions
  const todayCompletions = activeHabitPlan
    ? await prisma.habitCompletion.findMany({
        where: {
          clientId: session.userId,
          date: todayStr,
          habitPlanItemId: {
            in: activeHabitPlan.items.map(item => item.id)
          }
        }
      })
    : [];

  // Fetch today's checkin
  const todayCheckIn = await prisma.dailyCheckIn.findUnique({
    where: {
      clientId_date: {
        clientId: session.userId,
        date: todayStr
      }
    }
  })

  // Calculate has-ever-had flags and active plans
  const hasEverHadDiet = activeConnection ? activeConnection.dietPlans.length > 0 : false;
  const hasEverHadWorkout = activeConnection ? activeConnection.workoutPlans.length > 0 : false;
  const hasEverHadYoga = activeConnection ? activeConnection.yogaPlans.length > 0 : false;
  const hasEverHadAnyPlan = hasEverHadDiet || hasEverHadWorkout || hasEverHadYoga;

  const activeDiet = activeConnection?.dietPlans.find(p => p.status === "ACTIVE");
  const activeWorkout = activeConnection?.workoutPlans.find(p => p.status === "ACTIVE");
  const activeYoga = activeConnection?.yogaPlans.find(p => p.status === "ACTIVE");

  // Get first name for greeting from email
  const firstName = profile.user.email.split("@")[0] || "Client"
  
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
            <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">Progress</h2>
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
              <Link href="/client/progress">View Progress</Link>
            </Button>
            <Button variant="secondary" className="w-1/2" asChild>
              <Link href="/client/progress">Log Weight</Link>
            </Button>
          </div>
        </section>

        {/* Food & Nutrition Card */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col">
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)] mb-4">Food & Nutrition</h2>
          {summary.meals.length === 0 && summary.waterEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-secondary-50)] text-[var(--color-secondary-500)] flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M18.5 15.5 12 22l-6.5-6.5a8.48 8.48 0 0 1 0-12 8.48 8.48 0 0 1 13 0"/></svg>
              </div>
              <p className="text-sm font-medium text-[var(--color-neutral-700)] mb-1">Nothing logged yet</p>
              <p className="text-xs text-[var(--color-neutral-500)] mb-4">Log your first meal or water today.</p>
              <Button asChild>
                <Link href="/client/food">Log Food or Water</Link>
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
                <Link href="/client/food">View Details & Log</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Today's Plan Card */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col">
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)] mb-4">Today's Plan</h2>
          {!activeConnection ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 text-center border-2 border-dashed border-[var(--color-neutral-200)] rounded-lg">
              <p className="text-sm text-[var(--color-neutral-500)] px-4 mb-4">You are not currently connected to a coach.</p>
            </div>
          ) : !hasEverHadAnyPlan ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 text-center border-2 border-dashed border-[var(--color-neutral-200)] rounded-lg">
              <p className="text-sm text-[var(--color-neutral-500)] px-4 mb-4">Your coach hasn't set up your plan yet.</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/client/plan">View Plans Tab</Link>
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              {hasEverHadDiet && (
                <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)] flex-1">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] mb-1">DIET PLAN</p>
                  {activeDiet ? (
                    <>
                      <p className="font-bold text-lg text-[var(--color-neutral-900)] truncate">{activeDiet.title}</p>
                      <p className="text-sm text-[var(--color-neutral-600)] mt-2 line-clamp-2">
                        {activeDiet.overview || "View details for meal guidance and rules."}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-neutral-500)] mt-1">No active diet plan.</p>
                  )}
                </div>
              )}
              {hasEverHadWorkout && (
                <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)] flex-1">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] mb-1">WORKOUT PLAN</p>
                  {activeWorkout ? (
                    <>
                      <p className="font-bold text-lg text-[var(--color-neutral-900)] truncate">{activeWorkout.title}</p>
                      <p className="text-sm text-[var(--color-neutral-600)] mt-2 line-clamp-2">
                        {activeWorkout.overview || "View details for your workout sessions."}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-neutral-500)] mt-1">No active workout plan.</p>
                  )}
                </div>
              )}
              {hasEverHadYoga && (
                <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)] flex-1">
                  <p className="text-xs font-semibold text-[var(--color-primary-600)] mb-1">YOGA PLAN</p>
                  {activeYoga ? (
                    <>
                      <p className="font-bold text-lg text-[var(--color-neutral-900)] truncate">{activeYoga.title}</p>
                      <p className="text-sm text-[var(--color-neutral-600)] mt-2 line-clamp-2">
                        {activeYoga.overview || "View details for your yoga sequences."}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-neutral-500)] mt-1">No active yoga plan.</p>
                  )}
                </div>
              )}
              <Button variant="secondary" className="w-full mt-auto" asChild>
                <Link href="/client/plan">View Full Plans</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Habits Card */}
        <DashboardHabitsCard
          habitItems={activeHabitPlan?.items || []}
          initialCompletions={todayCompletions}
          isConnected={!!activeConnection}
          hasPlan={!!activeHabitPlan}
        />
        
        {/* Check-ins Card */}
        <DashboardCheckinCard todayCheckIn={todayCheckIn} />

        {/* Your Coach Card */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] md:col-span-2">
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)] mb-4">Your Coach</h2>
          {activeConnection && activeConnection.coach ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeConnection.coach.coachProfile?.profilePhoto ? (
                  <img src={activeConnection.coach.coachProfile.profilePhoto} alt="Coach" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-[var(--color-neutral-400)] text-xs font-bold">
                    C
                  </div>
                )}
                <div>
                  <p className="font-medium text-[var(--color-neutral-800)]">{activeConnection.coach.coachProfile?.businessName || activeConnection.coach.email}</p>
                  <p className="text-xs text-[var(--color-secondary-600)] font-medium">Connected</p>
                </div>
              </div>
              <Button disabled variant="secondary" size="sm">Message</Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[var(--color-neutral-500)]">
                You are not currently connected to a coach. Check your email for an invitation link if you are expecting one.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
