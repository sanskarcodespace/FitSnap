import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/states"
import { Utensils, Dumbbell, Calendar, Target, FileText, CheckSquare, Activity, MessageCircle } from "lucide-react"
import { NutritionTargetsForm } from "./NutritionTargetsForm"
import { DailyFoodLogView } from "@/components/food/DailyFoodLogView"
import Link from "next/link"
import { getDailyNutritionSummary } from "@/lib/data/nutrition"
import { CoachFoodHistoryTab } from "./CoachFoodHistoryTab"

const GOALS: Record<string, string> = {
  "WEIGHT_LOSS": "Weight Loss",
  "WEIGHT_GAIN": "Weight Gain",
  "MAINTENANCE": "Maintenance",
  "STRENGTH": "Strength & Muscle",
  "YOGA": "Yoga Improvement",
  "GENERAL_HEALTH": "General Health"
}

export default async function ClientDetailPage(
  props: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ date?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")

  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") redirect("/login")

  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: params.id },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      nutritionTarget: true
    }
  })

  // Ensure this coach owns this connection and it is active
  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    redirect("/coach")
  }

  const clientName = connection.client?.email?.split('@')[0] || "Client"
  const profile = connection.client?.clientProfile
  const nutritionTarget = connection.nutritionTarget

  // Date Logic for Food History
  const todayStr = new Date().toISOString().split('T')[0]
  const queryDate = searchParams.date || todayStr
  const dateToUse = queryDate > todayStr ? todayStr : queryDate
  const summary = await getDailyNutritionSummary(connection.clientId || "", dateToUse, session.userId)

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
                        <p className="font-medium mt-1">{profile.currentWeight ? `${profile.currentWeight} ${profile.preferredWeightUnit}` : "Not set"}</p>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-[var(--color-primary-600)]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-[var(--color-neutral-50)] rounded border border-dashed border-[var(--color-neutral-300)]">
                  <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">Activity feed coming in future blocks.</p>
                </div>
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
                          const prev = new Date(dateToUse);
                          prev.setDate(prev.getDate() - 1);
                          return prev.toISOString().split('T')[0];
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
                            const next = new Date(dateToUse);
                            next.setDate(next.getDate() + 1);
                            return next.toISOString().split('T')[0];
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
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Diet & Workout Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={<Dumbbell className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                title="Plans Coming Soon" 
                description="The ability to assign structured diet and workout plans will be available in Blocks 15-17." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={<CheckSquare className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                title="Habits Coming Soon" 
                description="Daily habit tracking will be built in Block 18." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Weight & Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={<Activity className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                title="Progress Coming Soon" 
                description="Weight tracking charts and progress photo galleries will be available in Block 20." 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Check-ins & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState 
                icon={<FileText className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                title="Check-ins Coming Soon" 
                description="Weekly check-in forms and progress reports will be available in future blocks." 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
