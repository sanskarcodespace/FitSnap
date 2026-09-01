import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/states"
import { Utensils, Dumbbell, Calendar, Target, FileText, CheckSquare, Activity, MessageCircle } from "lucide-react"
import { NutritionTargetsForm } from "./NutritionTargetsForm"
import { DailyFoodLogView } from "@/components/food/DailyFoodLogView"
import Link from "next/link"
import { getDailyNutritionSummary } from "@/lib/data/nutrition"
import { CoachFoodHistoryTab } from "./CoachFoodHistoryTab"
import { CoachDietTab } from "./CoachDietTab"
import { CoachWorkoutTab } from "./CoachWorkoutTab"
import { CoachYogaTab } from "./CoachYogaTab"
import { CoachCheckinsTab } from "./CoachCheckinsTab"
import { CoachProgressTab } from "./CoachProgressTab"
import { CoachHabitsTab } from "./CoachHabitsTab"
import { getClientActivitySignals } from "@/lib/data/activity-signals"
import { getClientAttentionFlags } from "@/lib/data/attention-flags"
import { AlertCircle } from "lucide-react"

const GOALS: Record<string, string> = {
  "WEIGHT_LOSS": "Weight Loss",
  "WEIGHT_GAIN": "Weight Gain",
  "MAINTENANCE": "Maintenance",
  "STRENGTH": "Strength & Muscle",
  "YOGA": "Yoga Improvement",
  "GENERAL_HEALTH": "General Health"
}

export default async function ClientDetailPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const connectionId = resolvedParams.id;
  const resolvedSearchParams = await searchParams;
  
  const token = (await cookies()).get("session_token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "COACH") redirect("/login");

  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      nutritionTarget: true,
      dietPlans: {
        include: {
          mealGuidance: true,
          guidelines: true,
        }
      },
      workoutPlans: {
        include: {
          sessions: {
            include: {
              exercises: true
            }
          },
          guidelines: true
        }
      },
      yogaPlans: {
        include: {
          sequences: {
            include: {
              poses: true
            }
          },
          guidelines: true
        }
      },
      habitPlans: {
        include: {
          items: true,
          guidelines: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  // Ensure this coach owns this connection and it is active
  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    redirect("/coach")
  }
  
  const isActive = connection.status === "ACTIVE";
  const clientProfile = connection.client?.clientProfile;
  const isSetupPending = !clientProfile?.onboardingCompleted;

  let signals = null;
  let attentionFlags: any[] = [];
  if (connection.clientId) {
    signals = await getClientActivitySignals(session.userId, connection.clientId);
    attentionFlags = await getClientAttentionFlags(session.userId, connection.clientId);
  }

  const clientName = connection.client?.email?.split('@')[0] || "Client"
  const profile = connection.client?.clientProfile
  const nutritionTarget = connection.nutritionTarget

  // Date Logic for Food History
  const todayStr = new Date().toISOString().split('T')[0]
  const queryDate = typeof resolvedSearchParams.date === 'string' ? resolvedSearchParams.date : todayStr
  const dateToUse = queryDate > todayStr ? todayStr : queryDate
  const summary = await getDailyNutritionSummary(connection.clientId || "", dateToUse, session.userId)

  const mostRecentWeight = await prisma.weightEntry.findFirst({
    where: { clientId: connection.clientId || "" },
    orderBy: { date: 'desc' }
  })

  // Fetch recent workout logs
  const recentWorkoutLogs = await prisma.workoutLog.findMany({
    where: { clientId: connection.clientId || "" },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 10
  });

  // Fetch recent yoga logs
  const recentYogaLogs = await prisma.yogaLog.findMany({
    where: { clientId: connection.clientId || "" },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 10
  });

  // Fetch client habit completions (FULL history per connection scope rule)
  const habitCompletions = await prisma.habitCompletion.findMany({
    where: { clientId: connection.clientId || "" },
    orderBy: { date: 'desc' }
  });

  // Signals and attention flags are already fetched above.

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header Profile Summary */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white p-6 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
        <Avatar 
          initials={clientName.substring(0, 2).toUpperCase()} 
          size="lg" 
          className="border-4 border-[var(--color-primary-100)] text-[var(--color-primary-700)] bg-[var(--color-primary-50)]"
        />
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold text-[var(--color-neutral-900)]">{clientName}</h1>
          <p className="text-[var(--color-neutral-500)]">{connection.client?.email}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {!profile?.onboardingCompleted ? (
              <Badge variant="warning" className="border-none">
                Profile Setup Pending
              </Badge>
            ) : (
              <Badge variant="success" className="border-none">
                Active Client
              </Badge>
            )}
            {profile?.goal && (
              <Badge variant="secondary" className="text-[var(--color-neutral-600)]">
                Goal: {GOALS[profile.goal] || profile.goal}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[var(--color-neutral-500)] border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]">
              Since {new Date(connection.acceptedAt || connection.invitedAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>
        <div className="md:ml-auto md:self-center mt-4 md:mt-0">
          <Link href={`/coach/clients/${connectionId}/report`}>
            <Button className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View Report
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-[var(--color-primary-600)]" />
                  Client Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Goal</p>
                        <p className="font-medium mt-1">{profile.goal ? GOALS[profile.goal] || profile.goal : "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Current Weight</p>
                        <p className="font-medium mt-1">{(mostRecentWeight?.weightValue ?? profile.currentWeight) ? `${mostRecentWeight?.weightValue ?? profile.currentWeight} ${profile.preferredWeightUnit}` : "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Target Weight</p>
                        <p className="font-medium mt-1">{profile.targetWeight ? `${profile.targetWeight} ${profile.preferredWeightUnit}` : "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Height</p>
                        <p className="font-medium mt-1">{profile.height ? `${profile.height} cm` : "Not set"}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[var(--color-neutral-500)]">Profile not set up yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Needs Attention Panel */}
            {attentionFlags.length > 0 && (
              <Card className="border-[var(--color-accent-200)] shadow-sm bg-[var(--color-accent-50)]">
                <CardHeader className="pb-3 border-b border-[var(--color-accent-100)]">
                  <CardTitle className="flex items-center gap-2 text-lg text-[var(--color-accent-800)]">
                    <AlertCircle className="w-5 h-5" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {attentionFlags.map((flag) => (
                      <li key={flag.id} className="flex gap-3">
                        <div className="mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-500)] mt-2" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-accent-900)] text-sm">{flag.label}</p>
                          <div className="text-xs text-[var(--color-accent-700)] mt-0.5 leading-relaxed">
                            {flag.reason}
                            <Link 
                              href={`/coach/messages?connectionId=${connection.id}&text=${encodeURIComponent(`Regarding your ${flag.label}: `)}`}
                              className="ml-2 text-[var(--color-primary-600)] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Message about this
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-[var(--color-primary-600)]" />
                  Activity Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {signals ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Last Active</p>
                      <p className="font-medium mt-1 text-[var(--color-neutral-900)]">
                        {signals.lastActivityAt ? new Date(signals.lastActivityAt).toLocaleDateString() : "No activity"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Food Logging (7d)</p>
                      <p className="font-medium mt-1">
                        <Link href="#nutrition" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                          {signals.foodLoggingDays7d} / 7 days
                        </Link>
                        {signals.proteinAdherencePercent7d !== null && (
                          <span className="text-sm text-[var(--color-neutral-500)] ml-1 font-normal">
                            ({Math.round(signals.proteinAdherencePercent7d)}% pro)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Workouts (7d)</p>
                      <p className="font-medium mt-1">
                        <Link href="#plans" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                          {signals.workoutCount7d} logs
                        </Link>
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Yoga (7d)</p>
                      <p className="font-medium mt-1">
                        <Link href="#plans" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                          {signals.yogaCount7d} logs
                        </Link>
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Check-ins (7d)</p>
                      <p className="font-medium mt-1">
                        <Link href="#checkins" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                          {signals.checkInDays7d} / 7 days
                        </Link>
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Weight Change (30d)</p>
                      <p className="font-medium mt-1">
                        <Link href="#progress" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                          {!signals.hasWeightIn30d ? "No logs" : 
                            signals.weightChange30d === null || signals.weightChange30d === 0 ? "0 change" :
                            `${signals.weightChange30d > 0 ? '+' : ''}${signals.weightChange30d.toFixed(1)} ${profile?.preferredWeightUnit || 'lbs'}`}
                        </Link>
                      </p>
                    </div>
                    {signals.lowestHabit7d && (
                      <div className="col-span-2">
                        <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Lowest Habit (7d)</p>
                        <p className="font-medium mt-1">
                          <Link href="#habits" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                            {signals.lowestHabit7d.name}: {signals.lowestHabit7d.completed}/{signals.lowestHabit7d.total} days
                          </Link>
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] uppercase tracking-wider font-semibold">Latest Progress Photo</p>
                      <p className="font-medium mt-1">
                        <Link href="#progress" className="text-[var(--color-primary-700)] hover:underline font-semibold">
                          {signals.lastProgressPhotoAt ? new Date(signals.lastProgressPhotoAt).toLocaleDateString() : "No photos"}
                        </Link>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-[var(--color-neutral-50)] rounded border border-dashed border-[var(--color-neutral-300)]">
                    <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">No activity signals available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Nutrition Targets</CardTitle>
              <CardDescription>
                Set the daily macro and calorie goals for this client. 
                These will be displayed on their dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NutritionTargetsForm connectionId={connection.id} initialData={nutritionTarget} />
            </CardContent>
          </Card>

          <Tabs defaultValue="daily" className="w-full mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[var(--color-neutral-900)]">Food Logs & History</h3>
              <TabsList>
                <TabsTrigger value="daily">Daily Log</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="daily">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl">Daily Log</CardTitle>
                  
                  {/* Date Navigator for Coach View */}
                  <div className="flex items-center gap-4 bg-[var(--color-neutral-50)] rounded-lg p-1 border border-[var(--color-neutral-200)]">
                    <Link 
                      href={`/coach/clients/${connection.id}?date=${
                        (() => {
                          // Parse as local date to avoid UTC offset shifting the day
                          const [y, mo, d] = dateToUse.split('-').map(Number)
                          const prev = new Date(y, mo - 1, d)
                          prev.setDate(prev.getDate() - 1)
                          const py = prev.getFullYear()
                          const pm = String(prev.getMonth() + 1).padStart(2, '0')
                          const pd = String(prev.getDate()).padStart(2, '0')
                          return `${py}-${pm}-${pd}`
                        })()
                      }#nutrition`}
                      className="px-2 py-1 text-sm font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]"
                    >
                      ← Prev
                    </Link>
                    
                    <span className="text-sm font-bold text-[var(--color-neutral-800)] min-w-[100px] text-center">
                      {dateToUse === todayStr ? "Today" : new Date(dateToUse + "T12:00:00Z").toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    
                    {dateToUse >= todayStr ? (
                      <span className="px-2 py-1 text-sm font-medium text-[var(--color-neutral-300)] cursor-not-allowed">Next →</span>
                    ) : (
                      <Link 
                        href={`/coach/clients/${connection.id}?date=${
                          (() => {
                            // Parse as local date to avoid UTC offset shifting the day
                            const [y, mo, d] = dateToUse.split('-').map(Number)
                            const next = new Date(y, mo - 1, d)
                            next.setDate(next.getDate() + 1)
                            const ny = next.getFullYear()
                            const nm = String(next.getMonth() + 1).padStart(2, '0')
                            const nd = String(next.getDate()).padStart(2, '0')
                            return `${ny}-${nm}-${nd}`
                          })()
                        }#nutrition`}
                        className="px-2 py-1 text-sm font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]"
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <DailyFoodLogView 
                    summary={summary}
                    readOnly={true}
                    coachConnectionId={connection.id}
                    date={dateToUse}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <CoachFoodHistoryTab clientId={connection.clientId || ""} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <Tabs defaultValue="diet" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[var(--color-neutral-900)]">Diet & Workout Plans</h3>
              <TabsList>
                <TabsTrigger value="diet">Diet</TabsTrigger>
                <TabsTrigger value="workout">Workout</TabsTrigger>
                <TabsTrigger value="yoga">Yoga</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="diet">
              <CoachDietTab connectionId={connection.id} dietPlans={connection.dietPlans} />
            </TabsContent>
            
            <TabsContent value="workout">
              {!isActive ? (
                <EmptyState 
                  icon={<Activity className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                  title="Not connected" 
                  description="Workout plans can only be managed for active clients." 
                />
              ) : (
                <CoachWorkoutTab connectionId={connection.id} workoutPlans={connection.workoutPlans as any} recentLogs={recentWorkoutLogs} />
              )}
            </TabsContent>
            
            <TabsContent value="yoga">
              {!isActive ? (
                <EmptyState 
                  icon={<Activity className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                  title="Not connected" 
                  description="Yoga plans can only be managed for active clients." 
                />
              ) : (
                <CoachYogaTab connectionId={connection.id} yogaPlans={connection.yogaPlans as any} recentLogs={recentYogaLogs} />
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="habits" className="mt-6">
          <CoachHabitsTab 
            connectionId={connection.id} 
            clientId={connection.clientId || ""} 
            habitPlans={connection.habitPlans as any} 
            completions={habitCompletions.map(c => ({
              id: c.id,
              habitPlanItemId: c.habitPlanItemId,
              habitNameSnapshot: c.habitNameSnapshot,
              date: c.date,
              note: c.note
            }))} 
          />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Weight & Measurements</CardTitle>
              <CardDescription>
                View your client's weight logs and body measurements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoachProgressTab clientId={connection.clientId || ""} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Daily Check-ins</CardTitle>
              <CardDescription>
                View your client's daily sleep, steps, mood, and energy history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isActive ? (
                <EmptyState 
                  icon={<FileText className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                  title="Not connected" 
                  description="Check-ins can only be viewed for active clients." 
                />
              ) : (
                <CoachCheckinsTab clientId={connection.clientId || ""} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
