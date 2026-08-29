import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import prisma from "@/lib/db/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/states"
import { Dumbbell, Activity } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientDietTab } from "./ClientDietTab"
import { ClientWorkoutTab } from "./ClientWorkoutTab"

export default async function ClientPlanPage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")

  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      clientConnections: {
        where: { status: "ACTIVE" },
        include: {
          dietPlans: {
            include: {
              mealGuidance: true,
              guidelines: true,
            },
            orderBy: { createdAt: 'desc' }
          },
          workoutPlans: {
            include: {
              sessions: {
                include: {
                  exercises: true
                }
              },
              guidelines: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      },
      workouts: {
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 50
      }
    }
  })

  if (!user) redirect("/login")

  const activeConnection = user.clientConnections[0];
  const isConnected = !!activeConnection;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-neutral-900)]">Your Plan</h1>
        <p className="text-[var(--text-body-size)] text-[var(--color-neutral-600)] mt-2">
          Structured guidance from your coach to help you reach your goals.
        </p>
      </div>

      <Tabs defaultValue="diet" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="diet">Diet</TabsTrigger>
          <TabsTrigger value="workout">Workout</TabsTrigger>
          <TabsTrigger value="yoga">Yoga</TabsTrigger>
        </TabsList>
        
        <TabsContent value="diet">
          <ClientDietTab 
            dietPlans={activeConnection?.dietPlans || []} 
            isConnected={isConnected} 
          />
        </TabsContent>
        
        <TabsContent value="workout">
          <ClientWorkoutTab 
            workoutPlans={activeConnection?.workoutPlans || []}
            isConnected={isConnected}
            workoutLogs={user.workouts}
          />
        </TabsContent>
        
        <TabsContent value="yoga">
          <Card>
            <CardContent className="pt-6">
              <EmptyState 
                icon={<Activity className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
                title="Yoga plans are coming soon" 
                description="The ability to receive structured yoga plans will be available in Block 17." 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
