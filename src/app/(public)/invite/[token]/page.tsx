import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert } from "@/components/ui/alert"
import { InviteSignupForm, InviteLoginForm, LogoutButton } from "./ClientAcceptanceForms"

export default async function InviteAcceptancePage({ params }: { params: { token: string } }) {
  const token = params.token
  
  // 1. Validate connection token
  const connection = await prisma.coachClientConnection.findUnique({
    where: { invitationToken: token },
    include: { coach: { include: { coachProfile: true } } }
  })

  const ErrorCard = ({ title, message }: { title: string, message: string }) => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-50)] p-4">
      <Card className="w-full max-w-md shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--color-primary-950)]">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="error" className="mb-4">{message}</Alert>
        </CardContent>
      </Card>
    </div>
  )

  if (!connection) {
    return <ErrorCard title="Invalid Invitation" message="This invitation link is not valid or does not exist." />
  }

  if (connection.status !== "PENDING") {
    return <ErrorCard title="Invitation Unavailable" message="This invitation has already been used, cancelled, or is no longer valid." />
  }

  if (connection.invitationTokenExpiry < new Date()) {
    return <ErrorCard title="Invitation Expired" message="This invitation has expired. Please contact your coach for a new one." />
  }

  const coachName = connection.coach.coachProfile?.businessName || "Your Coach"

  // 2. Check Session
  const sessionToken = cookies().get("session_token")?.value
  let session = null
  if (sessionToken) {
    try {
      session = await verifyToken(sessionToken)
    } catch (e) {
      // invalid session, ignore
    }
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-50)] p-4">
        <Card className="w-full max-w-md shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[var(--color-primary-950)]">Active Session Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] leading-relaxed">
              You are currently logged into an account. To accept this invitation for <strong>{connection.invitedEmail}</strong>, you must log out first.
            </p>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  // 3. Check existing user
  const existingUser = await prisma.user.findUnique({
    where: { email: connection.invitedEmail }
  })

  let viewType: "SIGNUP" | "LOGIN" | "BLOCK_COACH" | "BLOCK_ACTIVE" = "SIGNUP"

  if (existingUser) {
    if (existingUser.role === "COACH") {
      viewType = "BLOCK_COACH"
    } else {
      // Check if already active with another coach
      const activeConnection = await prisma.coachClientConnection.findFirst({
        where: { clientId: existingUser.id, status: "ACTIVE" }
      })
      if (activeConnection) {
        viewType = "BLOCK_ACTIVE"
      } else {
        viewType = "LOGIN"
      }
    }
  }

  if (viewType === "BLOCK_COACH") {
    return <ErrorCard title="Cannot Accept Invitation" message="This email address belongs to a Coach account. Coach accounts cannot accept client invitations." />
  }

  if (viewType === "BLOCK_ACTIVE") {
    return <ErrorCard title="Already Connected" message="You are already actively connected to another coach. You must end that connection before accepting a new invitation." />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-50)] p-4">
      <Card className="w-full max-w-md shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--color-primary-950)] text-center">
            {coachName} has invited you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {connection.personalMessage && (
            <div className="bg-[var(--color-primary-50)] p-4 rounded-lg italic text-[var(--color-primary-900)] text-[var(--text-body-sm-size)] shadow-sm">
              "{connection.personalMessage}"
            </div>
          )}

          {viewType === "SIGNUP" && (
            <>
              <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] text-center">
                Create your client account to get started.
              </p>
              <InviteSignupForm 
                token={token} 
                name={connection.invitedName || ""} 
                email={connection.invitedEmail} 
              />
            </>
          )}

          {viewType === "LOGIN" && (
            <>
              <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] text-center">
                Welcome back! Log in to connect with {coachName}.
              </p>
              <InviteLoginForm 
                token={token} 
                email={connection.invitedEmail} 
              />
            </>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
