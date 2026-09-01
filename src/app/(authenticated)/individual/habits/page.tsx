import { verifyToken } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { IndividualHabitsView } from "./IndividualHabitsView";
import { AlertCircle, CheckSquare, Sparkles } from "lucide-react";

export default async function IndividualHabitsPage() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) redirect("/login");

  const session = await verifyToken(token);
  if (!session || session.role !== "INDIVIDUAL") redirect("/login");

  // Fetch client profile and ensure onboarding is done
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId }
  });
  if (!profile?.onboardingCompleted) {
    redirect("/individual/onboarding");
  }

  // Fetch self-managed habit plans for this individual
  const habitPlans = await prisma.habitPlan.findMany({
    where: { 
      clientId: session.userId,
      coachClientConnectionId: null
    },
    include: {
      items: true,
      guidelines: true
    },
    orderBy: { createdAt: "desc" }
  });

  const activePlan = habitPlans.find(hp => hp.status === "ACTIVE") || null;

  // Fetch all habit completions directly
  const completions = await prisma.habitCompletion.findMany({
    where: { clientId: session.userId },
    orderBy: { date: "desc" }
  });

  const allCompletions = completions.map(c => ({
    id: c.id,
    habitPlanItemId: c.habitPlanItemId,
    habitNameSnapshot: c.habitNameSnapshot,
    date: c.date,
    note: c.note
  }));

  // Extract all habit items across all self-managed plans
  const allHabitItemsRaw: any[] = [];
  const archivedPlans: any[] = [];

  for (const plan of habitPlans) {
    if (plan.status === "ARCHIVED") {
      archivedPlans.push({
        id: plan.id,
        title: plan.title,
        overview: plan.overview,
        archivedAt: plan.archivedAt || plan.updatedAt,
        items: plan.items.filter(item => item.status === "active"),
        guidelines: plan.guidelines
      });
    }

    for (const item of plan.items) {
      const isActiveInCurrentPlan =
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
        coachName: "Me",
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

  // Sort: Active items first by sortOrder; then past items by plan date (newest plan first)
  const currentHabits = allHabitItemsRaw
    .filter(h => h.isActiveInCurrentPlan)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  
  const pastHabits = allHabitItemsRaw
    .filter(h => !h.isActiveInCurrentPlan && h.completions.length > 0)
    .sort((a, b) => b.planDate.getTime() - a.planDate.getTime() || a.sortOrder - b.sortOrder);

  const allHabitItems = [...currentHabits, ...pastHabits];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="pb-6">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          My Habits
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Track daily routines and stay consistent with your goals.
        </p>
      </div>

      <IndividualHabitsView 
        activePlan={activePlan}
        allHabitItems={allHabitItems}
        allCompletions={allCompletions}
        archivedPlans={archivedPlans}
      />
    </div>
  );
}
