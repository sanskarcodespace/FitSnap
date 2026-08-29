import { verifyToken } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ClientHabitsView } from "./ClientHabitsView";

export default async function ClientHabitsPage() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") redirect("/login");

  // Fetch client profile and ensure onboarding is done
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId }
  });
  if (!profile?.onboardingCompleted) {
    redirect("/client/onboarding");
  }

  // Fetch all connections (active and ended) for this client
  const connections = await prisma.coachClientConnection.findMany({
    where: { clientId: session.userId },
    include: {
      coach: {
        include: {
          coachProfile: true
        }
      },
      habitPlans: {
        include: {
          items: true,
          guidelines: true
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  const activeConnection = connections.find(c => c.status === "ACTIVE") || null;
  const activePlan = activeConnection?.habitPlans.find(hp => hp.status === "ACTIVE") || null;

  // Fetch all habit completions directly
  const completions = await prisma.habitCompletion.findMany({
    where: { clientId: session.userId },
    orderBy: { date: "desc" }
  });

  // Extract all habit items across all connections and plans
  const allHabitItemsRaw: any[] = [];
  const archivedPlans: any[] = [];

  for (const conn of connections) {
    const coachName = conn.coach?.coachProfile?.businessName || conn.coach?.email?.split("@")[0] || "Coach";
    for (const plan of conn.habitPlans) {
      if (plan.status === "ARCHIVED") {
        archivedPlans.push({
          id: plan.id,
          title: plan.title,
          overview: plan.overview,
          archivedAt: plan.archivedAt || plan.updatedAt,
          items: plan.items.filter(item => item.status === "active"), // only active items when archived
          guidelines: plan.guidelines
        });
      }

      for (const item of plan.items) {
        // A past item is an item belonging to an archived plan, OR
        // an item marked "removed" in the active plan, OR
        // any item belonging to an ended connection.
        const isActiveInCurrentPlan =
          conn.status === "ACTIVE" &&
          plan.status === "ACTIVE" &&
          item.status === "active";

        const itemCompletions = completions.filter(c => c.habitPlanItemId === item.id);

        allHabitItemsRaw.push({
          id: item.id,
          name: item.name,
          description: item.description,
          targetFrequency: item.targetFrequency,
          targetTimesPerWeek: item.targetTimesPerWeek,
          status: item.status,
          planId: plan.id,
          planTitle: plan.title,
          planStatus: plan.status,
          planDate: plan.createdAt,
          sortOrder: item.sortOrder,
          coachName,
          completions: itemCompletions.map(c => ({
            id: c.id,
            habitPlanItemId: c.habitPlanItemId,
            habitNameSnapshot: c.habitNameSnapshot,
            date: c.date,
            note: c.note
          })),
          isActiveInCurrentPlan
        });
      }
    }
  }

  // Sort: Active items first by sortOrder; then past items by plan date (newest plan first)
  const currentHabits = allHabitItemsRaw
    .filter(h => h.isActiveInCurrentPlan)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  
  // For past items, we only want those that have completions, OR
  // belonged to the current/past plans (meaning we don't list completely empty removed items without history)
  // Let's filter past items to show only those that have completions. This keeps history clean.
  const pastHabits = allHabitItemsRaw
    .filter(h => !h.isActiveInCurrentPlan && h.completions.length > 0)
    .sort((a, b) => b.planDate.getTime() - a.planDate.getTime() || a.sortOrder - b.sortOrder);

  const allHabitItems = [...currentHabits, ...pastHabits];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="pb-6">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Habits
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Track daily routines and consistency guidelines assigned by your coach.
        </p>
      </div>

      <ClientHabitsView
        activeConnection={activeConnection}
        activePlan={activePlan}
        allHabitItems={allHabitItems}
        allCompletions={completions.map(c => ({
          id: c.id,
          habitPlanItemId: c.habitPlanItemId,
          habitNameSnapshot: c.habitNameSnapshot,
          date: c.date,
          note: c.note
        }))}
        archivedPlans={archivedPlans}
      />
    </div>
  );
}
