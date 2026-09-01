import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import CoachSettings from "./SettingsClient"

import { getActiveSessions } from "../../settings/actions"

export default async function CoachSettingsPage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { coachProfile: true }
  })

  if (!user || !user.coachProfile) redirect("/login")

  const activeSessions = await getActiveSessions()

  return (
    <CoachSettings 
      user={{ id: user.id, email: user.email }}
      profile={user.coachProfile}
      activeSessions={activeSessions}
    />
  )
}
