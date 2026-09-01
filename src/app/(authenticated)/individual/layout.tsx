import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { IndividualLayout } from "@/components/layout/individual-layout"

export default async function IndividualRouteLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("session_token")?.value
  let user = null
  let profilePhoto = undefined
  let name = "User"
  let onboardingCompleted = false

  if (token) {
    const session = await verifyToken(token)
    if (session) {
      if (session.role !== "INDIVIDUAL") {
        redirect(session.role === "COACH" ? "/coach" : "/client")
      }
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { clientProfile: true }
      })
      if (dbUser) {
        user = dbUser
        name = dbUser.email.split("@")[0] || dbUser.email
        profilePhoto = dbUser.clientProfile?.profilePhoto || undefined
        onboardingCompleted = dbUser.clientProfile?.onboardingCompleted || false
      }
    }
  }

  const handleLogout = async () => {
    "use server";
    (await cookies()).delete("session_token")
    redirect("/login")
  }

  // If onboarding is not completed, render without the nav shell
  if (!onboardingCompleted) {
    return <>{children}</>
  }

  return (
    <IndividualLayout 
      onLogout={handleLogout}
      user={user ? {
        name,
        avatarUrl: profilePhoto
      } : {
        name: "User",
        avatarUrl: undefined
      }}
    >
      {children}
    </IndividualLayout>
  )
}
