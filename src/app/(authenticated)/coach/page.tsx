import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ClientsSection } from "./ClientsSection"
import { getClientActivitySignals } from "@/lib/data/activity-signals"
import { getClientAttentionFlags } from "@/lib/data/attention-flags"

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
  const q = (searchParams.q as string)?.toLowerCase() || ""
  const sort = (searchParams.sort as string)?.toLowerCase() || "recent"
  const statusFilter = (searchParams.status as string)?.toUpperCase() || ""
  const goalFilter = (searchParams.goal as string)?.toUpperCase() || ""
  const attentionFilter = (searchParams.attention as string)?.toUpperCase() || ""

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

  // Fetch signals for all active connections
  const activeConnectionsWithSignals = await Promise.all(
    activeConnectionsRaw.map(async (conn) => {
      if (!conn.clientId) return { ...conn, signals: null, attentionFlags: [] };
      try {
        const signals = await getClientActivitySignals(user.id, conn.clientId);
        const attentionFlags = await getClientAttentionFlags(user.id, conn.clientId);
        return { ...conn, signals, attentionFlags };
      } catch (err) {
        return { ...conn, signals: null, attentionFlags: [] };
      }
    })
  );

  // Apply filters
  let filteredActive = activeConnectionsWithSignals.filter(conn => {
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
      
      if (statusFilter === "INACTIVE_7" || statusFilter === "INACTIVE_14") {
        if (isPendingSetup) return false; // Inactive logic applies to setup clients? Usually just fully active ones.
        const daysThreshold = statusFilter === "INACTIVE_7" ? 7 : 14;
        
        if (!conn.signals || !conn.signals.lastActivityAt) {
          // No activity ever
          return true;
        } else {
          const lastActivity = new Date(conn.signals.lastActivityAt);
          const diffMs = new Date().getTime() - lastActivity.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays < daysThreshold) return false;
        }
      }
    }

    // Goal filter
    if (goalFilter) {
      if (clientProfile?.goal !== goalFilter) return false
    }

    // Attention filter
    if (attentionFilter === "NEEDS_ATTENTION") {
      if (!conn.attentionFlags || conn.attentionFlags.length === 0) return false;
    }

    return true
  })

  // Apply sorting
  filteredActive.sort((a, b) => {
    const profileA = a.client?.clientProfile
    const profileB = b.client?.clientProfile
    const nameA = (a.client?.email?.split('@')[0] || "").toLowerCase()
    const nameB = (b.client?.email?.split('@')[0] || "").toLowerCase()

    if (sort === "attention_first") {
      const countA = a.attentionFlags?.length || 0;
      const countB = b.attentionFlags?.length || 0;
      if (countA !== countB) return countB - countA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sort === "name") {
      return nameA.localeCompare(nameB)
    } else if (sort === "goal") {
      const goalA = profileA?.goal || ""
      const goalB = profileB?.goal || ""
      return goalA.localeCompare(goalB)
    } else if (sort === "activity_desc" || sort === "activity_asc") {
      const timeA = a.signals?.lastActivityAt ? new Date(a.signals.lastActivityAt).getTime() : 0;
      const timeB = b.signals?.lastActivityAt ? new Date(b.signals.lastActivityAt).getTime() : 0;
      if (sort === "activity_desc") {
        return timeB - timeA; // Most recent first
      } else {
        return timeA - timeB; // Least recent first
      }
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
        searchParams={{q, goal: goalFilter, status: statusFilter, sort, attention: attentionFilter}}
      />
    </div>
  )
}
