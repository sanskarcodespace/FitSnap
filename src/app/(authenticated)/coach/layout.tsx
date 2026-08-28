import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { CoachLayout } from "@/components/layout/coach-layout"

export default async function CoachLayoutWrapper({ children }: { children: React.ReactNode }) {
  const token = cookies().get("session_token")?.value
  let user = null
  let profilePhoto = undefined
  let name = "Coach"

  if (token) {
    const session = await verifyToken(token)
    if (session) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { coachProfile: true }
      })
      if (dbUser) {
        user = dbUser
        name = dbUser.coachProfile?.businessName || dbUser.email
        profilePhoto = dbUser.coachProfile?.profilePhoto || undefined
      }
    }
  }

  const handleLogout = async () => {
    "use server"
    cookies().delete("session_token")
    redirect("/login")
  }

  return (
    <CoachLayout 
      onLogout={handleLogout}
      user={user ? {
        name,
        email: user.email,
        avatarUrl: profilePhoto
      } : {
        name: "Coach",
        email: "",
        avatarUrl: undefined
      }}
    >
      {children}
    </CoachLayout>
  )
}
