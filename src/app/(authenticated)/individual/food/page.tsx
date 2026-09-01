import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { FoodPageLayout } from "../../client/food/FoodPageLayout"
import { getDailyNutritionSummary } from "@/lib/data/nutrition"

export default async function IndividualFoodPage(
  props: {
    searchParams: Promise<{ date?: string }>
  }
) {
  const searchParams = await props.searchParams;
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

  // Date Logic
  const todayStr = new Date().toISOString().split('T')[0]
  const queryDate = searchParams.date || todayStr

  // Prevent querying future dates if manually entered in URL
  const dateToUse = queryDate > todayStr ? todayStr : queryDate

  // Fetch summary
  const summary = await getDailyNutritionSummary(session.userId, dateToUse)

  return (
    <FoodPageLayout 
      date={dateToUse}
      summary={summary}
      basePath="/individual"
    />
  )
}
