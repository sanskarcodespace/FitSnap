import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ClientsSection } from "./ClientsSection"

export default async function CoachDashboardPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")

  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { coachProfile: true }
  })

  if (!user || !user.coachProfile?.onboardingCompleted) {
    redirect("/coach/onboarding")
  }

  // Parse search params
  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : ''
  const goalFilter = typeof searchParams.goal === 'string' ? searchParams.goal : ''
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : ''
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'recent'

  // Fetch all ACTIVE connections for this coach to apply filtering/sorting in memory or DB
  // Since we need to filter on client profile data (goal, onboardingCompleted), it's easier to fetch included data.
  const activeConnectionsRaw = await prisma.coachClientConnection.findMany({
    where: { 
      coachId: user.id, 
      status: "ACTIVE" 
    },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      }
    }
  })

  // Apply filters
  let filteredActive = activeConnectionsRaw.filter(conn => {
    const clientUser = conn.client
    const clientProfile = clientUser?.clientProfile
    const clientName = clientUser?.email?.split('@')[0] || "Client"
    const clientEmail = clientUser?.email || ""
    
    // Search filter
    if (q) {
      if (!clientName.toLowerCase().includes(q) && !clientEmail.toLowerCase().includes(q)) {
        return false
      }
    }

    // Status filter
    if (statusFilter) {
      const isPendingSetup = !clientProfile?.onboardingCompleted
      if (statusFilter === "ACTIVE" && isPendingSetup) return false
      if (statusFilter === "PENDING_SETUP" && !isPendingSetup) return false
    }

    // Goal filter
    if (goalFilter) {
      if (clientProfile?.goal !== goalFilter) return false
    }

    return true
  })

  // Apply sorting
  filteredActive.sort((a, b) => {
    const profileA = a.client?.clientProfile
    const profileB = b.client?.clientProfile
    const nameA = (a.client?.email?.split('@')[0] || "").toLowerCase()
    const nameB = (b.client?.email?.split('@')[0] || "").toLowerCase()

    if (sort === "name") {
      return nameA.localeCompare(nameB)
    } else if (sort === "goal") {
      const goalA = profileA?.goal || ""
      const goalB = profileB?.goal || ""
      return goalA.localeCompare(goalB)
    } else {
      // default: recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const pendingConnections = await prisma.coachClientConnection.findMany({
    where: { coachId: user.id, status: "PENDING" },
    orderBy: { invitedAt: "desc" }
  })

  const totalActive = activeConnectionsRaw.length
  const totalPending = pendingConnections.length

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-950)]">
            Welcome, {user.coachProfile.businessName}
          </h1>
          <p className="text-[var(--color-neutral-600)] mt-1">
            You have {totalActive} active {totalActive === 1 ? 'client' : 'clients'} and {totalPending} pending {totalPending === 1 ? 'invitation' : 'invitations'}.
          </p>
        </div>
      </div>

      <ClientsSection 
        pending={pendingConnections} 
        active={filteredActive as any} 
        searchParams={{q, goal: goalFilter, status: statusFilter, sort}}
      />
    </div>
  )
}
