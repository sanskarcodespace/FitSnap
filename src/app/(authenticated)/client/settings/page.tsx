import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import ClientSettings from "./SettingsClient"

import { getActiveSessions } from "../../settings/actions"

export default async function ClientSettingsPage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { clientProfile: true }
  })

  if (!user || !user.clientProfile) redirect("/login")

  const activeSessions = await getActiveSessions()

  return (
    <ClientSettings 
      user={{ id: user.id, email: user.email }}
      profile={user.clientProfile}
      activeSessions={activeSessions}
    />
  )
}
