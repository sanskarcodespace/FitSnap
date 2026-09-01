import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import prisma from "@/lib/db/prisma"
import { ClientMessages } from "./ClientMessages"
import { getConversation } from "@/app/(authenticated)/messages/actions"

export default async function ClientMessagesPage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/coach")

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect("/login")

  const activeConnection = await prisma.coachClientConnection.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { clientId: session.userId },
        { invitedEmail: user.email }
      ]
    },
    include: {
      coach: {
        include: { coachProfile: true }
      }
    }
  })

  if (!activeConnection) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Coach</h2>
        <p className="text-gray-500 text-center max-w-sm">You must be connected to a coach to send messages. Return to your dashboard to see your connection status.</p>
      </div>
    )
  }

  // Ensure conversation exists
  const conversation = await getConversation(activeConnection.id)

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col -mx-4 md:mx-0 border-x border-[var(--color-neutral-200)] bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-neutral-200)] bg-white sticky top-0 z-10 shadow-sm">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-neutral-100)] shrink-0 flex items-center justify-center text-[var(--color-neutral-400)] font-bold">
          {activeConnection.coach.coachProfile?.profilePhoto ? (
            <img src={activeConnection.coach.coachProfile.profilePhoto} alt="Coach" className="w-full h-full object-cover" />
          ) : (
            'C'
          )}
        </div>
        <div>
          <h1 className="font-bold text-lg text-[var(--color-neutral-800)] leading-tight">
            {activeConnection.coach.coachProfile?.businessName || activeConnection.coach.email}
          </h1>
          <p className="text-xs text-[var(--color-secondary-600)] font-medium">Your Coach</p>
        </div>
      </div>

      <ClientMessages 
        conversationId={conversation.id} 
        currentUserId={session.userId} 
      />
    </div>
  )
}
