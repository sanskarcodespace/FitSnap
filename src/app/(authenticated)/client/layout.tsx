import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { ClientLayout } from "@/components/layout/client-layout"

export default async function ClientRouteLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("session_token")?.value
  let user = null
  let profilePhoto = undefined
  let name = "Client"
  let onboardingCompleted = false

  if (token) {
    const session = await verifyToken(token)
    if (session) {
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

  // If onboarding is not completed, we do NOT want to show the full dashboard navigation shell.
  // The onboarding page itself will render its own centered layout.
  if (!onboardingCompleted) {
    return <>{children}</>
  }

  return (
    <ClientLayout 
      onLogout={handleLogout}
      user={user ? {
        name,
        avatarUrl: profilePhoto
      } : {
        name: "Client",
        avatarUrl: undefined
      }}
    >
      {children}
    </ClientLayout>
  )
}
