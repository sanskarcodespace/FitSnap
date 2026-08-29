import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { FoodLogClient } from "./FoodLogClient"

export default async function ClientFoodPage(
  props: {
    searchParams: Promise<{ date?: string }>
  }
) {
  const searchParams = await props.searchParams;
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

  // Get active connection for targets
  const activeConnection = await prisma.coachClientConnection.findFirst({
    where: {
      invitedEmail: session.email,
      status: "ACTIVE"
    },
    include: {
      nutritionTargets: true
    }
  })

  const currentTarget = activeConnection?.nutritionTargets[0]

  // Date Logic
  const todayStr = new Date().toISOString().split('T')[0]
  const queryDate = searchParams.date || todayStr

  // Prevent querying future dates if manually entered in URL
  const dateToUse = queryDate > todayStr ? todayStr : queryDate

  // Fetch data
  const meals = await prisma.mealLog.findMany({
    where: {
      clientId: session.userId,
      date: dateToUse
    },
    include: {
      foodItems: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  const waterEntries = await prisma.waterLogEntry.findMany({
    where: {
      clientId: session.userId,
      date: dateToUse
    },
    orderBy: {
      loggedAt: 'asc'
    }
  })

  return (
    <FoodLogClient 
      date={dateToUse}
      meals={meals}
      waterEntries={waterEntries}
      targetCalories={currentTarget?.targetCalories}
      targetProtein={currentTarget?.targetProtein}
      targetCarbs={currentTarget?.targetCarbs}
      targetFat={currentTarget?.targetFat}
    />
  )
}
