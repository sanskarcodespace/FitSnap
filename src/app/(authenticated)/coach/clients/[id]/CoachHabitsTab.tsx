"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { CheckCircle2, Circle, Trophy, Flame, Play, Square, FastForward, Check, Calendar, Activity, XCircle, CheckSquare, ChevronRight, ChevronLeft, History, Plus, Trash2, Edit, AlertCircle, Eye, Sparkles } from "lucide-react";
import { PeriodSelector } from "@/components/ui/period-selector";
import { createHabitPlan, updateHabitPlan, archiveAndStartNewHabitPlan, HabitPlanInput, HabitPlanItemInput } from "./plan/habit-actions";
import { useRouter } from "next/navigation";

interface HabitCompletion {
  id: string;
  habitPlanItemId: string;
  habitNameSnapshot: string;
  date: string;
  note: string | null;
}

interface HabitPlanItem {
  id: string;
  name: string;
  description: string | null;
  targetFrequency: string;
  targetTimesPerWeek: number | null;
  sortOrder: number;
  status: string;
}

interface HabitPlan {
  id: string;
  title: string;
  overview: string | null;
  status: string;
  createdAt: Date;
  archivedAt: Date | null;
  items: HabitPlanItem[];
  guidelines: { id: string; text: string }[];
}

interface CoachHabitsTabProps {
  connectionId: string;
  clientId: string;
  habitPlans: HabitPlan[];
  completions: HabitCompletion[];
}

function calculateStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(completionDates)).sort((a, b) => b.localeCompare(a));
  const todayStr = new Date().toISOString().split("T")[0];
  const latestDateStr = uniqueDates[0];

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const today = parseLocalDate(todayStr);
  const latest = parseLocalDate(latestDateStr);

  const diffTime = today.getTime() - latest.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return 0;

  let streak = 1;
  let currentDate = latest;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = parseLocalDate(uniqueDates[i]);
    const diff = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}

function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startDateStr.split("-").map(Number);
  const [ey, em, ed] = endDateStr.split("-").map(Number);

  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function CoachHabitsTab({
  connectionId,
  clientId,
  habitPlans,
  completions
}: CoachHabitsTabProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [isPending, startTransition] = useTransition();

  const activePlan = habitPlans.find(p => p.status === "ACTIVE");
  const archivedPlans = habitPlans.filter(p => p.status === "ARCHIVED").sort((a, b) =>
    new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime()
  );

  // Form State
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [items, setItems] = useState<HabitPlanItemInput[]>([]);
  const [guidelines, setGuidelines] = useState<{ id: string; text: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartCreate = () => {
    setTitle("");
    setOverview("");
    setItems([{ name: "", targetFrequency: "Daily" }]);
    setGuidelines([]);
    setErrorMsg(null);
    setMode("create");
  };

  const handleStartEdit = () => {
    if (!activePlan) return;
    setTitle(activePlan.title);
    setOverview(activePlan.overview || "");
    setItems(
      activePlan.items
        .filter(item => item.status === "active")
        .map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || undefined,
          targetFrequency: item.targetFrequency,
          targetTimesPerWeek: item.targetTimesPerWeek || undefined
        }))
    );
    setGuidelines(activePlan.guidelines.map(g => ({ id: g.id, text: g.text })));
    setErrorMsg(null);
    setMode("edit");
  };

  const handleStartNewPlan = () => {
    if (!window.confirm("Are you sure you want to start a new habit plan? The current plan will be archived and moved to Plan History. This action cannot be undone.")) {
      return;
    }
    setTitle("");
    setOverview("");
    setItems([{ name: "", targetFrequency: "Daily" }]);
    setGuidelines([]);
    setErrorMsg(null);
    setMode("create");
  };

  // Habits form array helpers
  const handleAddItem = () => {
    setItems([...items, { name: "", targetFrequency: "Daily" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof HabitPlanItemInput, value: any) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  // Guidelines form array helpers
  const handleAddGuideline = () => {
    setGuidelines([...guidelines, { id: crypto.randomUUID(), text: "" }]);
  };

  const handleRemoveGuideline = (id: string) => {
    setGuidelines(guidelines.filter(g => g.id !== id));
  };

  const handleGuidelineChange = (id: string, text: string) => {
    setGuidelines(guidelines.map(g => (g.id === id ? { ...g, text } : g)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Title is required");
      return;
    }

    const payload: HabitPlanInput = {
      title: title.trim(),
      overview: overview.trim() || undefined,
      items: items.map(item => ({
        id: item.id,
        name: item.name.trim(),
        description: item.description?.trim() || undefined,
        targetFrequency: item.targetFrequency,
        targetTimesPerWeek: item.targetFrequency === "TimesPerWeek" ? Number(item.targetTimesPerWeek) : undefined
      })),
      guidelines: guidelines.map(g => ({ text: g.text.trim() }))
    };

    startTransition(async () => {
      let res;
      if (mode === "create") {
        if (activePlan) {
          // Starting new plan, so archive active first
          res = await archiveAndStartNewHabitPlan(connectionId, payload);
        } else {
          res = await createHabitPlan(connectionId, payload);
        }
      } else {
        res = await updateHabitPlan(activePlan!.id, payload);
      }

      if (res.success) {
        setMode("view");
        router.refresh();
      } else {
        setErrorMsg(res.error || "An error occurred");
      }
    });
  };

  // History completions tracking view (read-only)
  const todayStr = new Date().toISOString().split("T")[0];
  const [period, setPeriod] = useState<"7" | "30" | "custom">("7");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [historyStart, setHistoryStart] = useState(thirtyDaysAgoStr);
  const [historyEnd, setHistoryEnd] = useState(todayStr);

  let rangeStart = historyStart;
  let rangeEnd = historyEnd;

  if (period === "7") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    rangeStart = d.toISOString().split("T")[0];
    rangeEnd = todayStr;
  } else if (period === "30") {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    rangeStart = d.toISOString().split("T")[0];
    rangeEnd = todayStr;
  }

  const historyDates = generateDateRange(rangeStart, rangeEnd);

  // Group habit items across current/past plans
  const allItemsMap = new Map<string, HabitPlanItem & { planDate: Date; planTitle: string; planStatus: string; coachName: string; isActiveInCurrentPlan: boolean; completions: HabitCompletion[] }>();
  
  for (const plan of habitPlans) {
    const isPlanActive = plan.status === "ACTIVE";
    for (const item of plan.items) {
      const isActiveInCurrentPlan = isPlanActive && item.status === "active";
      const itemCompletions = completions.filter(c => c.habitPlanItemId === item.id);

      allItemsMap.set(item.id, {
        ...item,
        planDate: new Date(plan.createdAt),
        planTitle: plan.title,
        planStatus: plan.status,
        coachName: "Coach",
        completions: itemCompletions,
        isActiveInCurrentPlan
      });
    }
  }

  const allHabitItems = Array.from(allItemsMap.values());
  const currentHabits = allHabitItems.filter(h => h.isActiveInCurrentPlan).sort((a, b) => a.sortOrder - b.sortOrder);
  const pastHabits = allHabitItems.filter(h => !h.isActiveInCurrentPlan && h.completions.length > 0).sort((a, b) =>
    b.planDate.getTime() - a.planDate.getTime() || a.sortOrder - b.sortOrder
  );

  const [pastExpanded, setPastExpanded] = useState(false);
  const [planHistoryExpanded, setPlanHistoryExpanded] = useState(false);

  const renderHistoryRow = (habit: any) => {
    const completionDates = habit.completions.map((c: any) => c.date);
    const streak = calculateStreak(completionDates);

    const completionsInPeriod = habit.completions.filter(
      (c: any) => c.date >= rangeStart && c.date <= rangeEnd
    );
    const completedDaysCount = completionsInPeriod.length;
    const totalDaysCount = historyDates.length;

    const frequencyLabel =
      habit.targetFrequency === "Daily"
        ? "Daily"
        : habit.targetFrequency === "TimesPerWeek"
        ? `${habit.targetTimesPerWeek}x/week`
        : "No specific target";

    return (
      <div key={habit.id} className="p-4 bg-white rounded-xl border border-[var(--color-neutral-200)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-[var(--color-neutral-800)]">{habit.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]">
                {frequencyLabel}
              </span>
              {!habit.isActiveInCurrentPlan && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                  Past Habit
                </span>
              )}
            </div>
            {habit.description && (
              <p className="text-xs text-[var(--color-neutral-500)] mt-1">{habit.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="text-right">
              <p className="text-[var(--color-neutral-500)] text-xs">Completed</p>
              <p className="text-[var(--color-neutral-800)] font-bold">{completedDaysCount} of {totalDaysCount} days</p>
            </div>
            <div className="text-right">
              <p className="text-[var(--color-neutral-500)] text-xs">Streak</p>
              <p className="text-[var(--color-primary-700)] font-bold flex items-center gap-1 justify-end">
                <Sparkles className="w-3.5 h-3.5 fill-[var(--color-primary-500)] text-transparent" />
                {streak} {streak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
        </div>

        {/* Completion Strip */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            {historyDates.map(date => {
              const comp = completionsInPeriod.find((c: any) => c.date === date);
              const isComp = !!comp;

              const [y, m, d] = date.split("-").map(Number);
              const dateLabel = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const tooltip = `${dateLabel}: ${isComp ? "Completed" : "Not Completed"}${comp?.note ? ` (${comp.note})` : ""}`;

              return (
                <div
                  key={date}
                  className={`w-3.5 h-3.5 rounded-full border-2 relative group cursor-help ${
                    isComp
                      ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)]"
                      : "bg-transparent border-[var(--color-neutral-300)]"
                  }`}
                  title={tooltip}
                />
              );
            })}
          </div>

          {/* Notes display */}
          {completionsInPeriod.some((c: any) => c.note) && (
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-2.5 border border-[var(--color-neutral-200)] mt-2">
              <p className="text-xs font-bold text-[var(--color-neutral-700)] mb-1">Notes in this period:</p>
              <ul className="space-y-1">
                {completionsInPeriod.filter((c: any) => c.note).map((c: any) => {
                  const [y, m, d] = c.date.split("-").map(Number);
                  const dt = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <li key={c.id} className="text-xs text-[var(--color-neutral-600)]">
                      <span className="font-semibold text-[var(--color-neutral-800)] mr-1">{dt}:</span>
                      {c.note}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (mode === "create" || mode === "edit") {
    return (
      <Card className="shadow-sm border-[var(--color-neutral-200)]">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "create" ? (activePlan ? "Start New Habit Plan" : "Create Habit Plan") : "Edit Habit Plan"}
          </CardTitle>
          <CardDescription>
            Assign keystone daily or weekly routines. Required: Title + at least oneOverview, Habit, or Guideline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-neutral-700)]">Plan Title *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-[var(--color-neutral-300)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                placeholder="e.g. Foundational Consistency Habits"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--color-neutral-700)]">Overview (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-[var(--color-neutral-300)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] h-24 whitespace-pre-wrap"
                placeholder="Explain the focus of these habits..."
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                maxLength={2000}
              />
            </div>

            {/* Habits List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[var(--color-neutral-800)] text-sm sm:text-base">Habits</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8">
                  <Plus className="w-4 h-4 mr-1" /> Add Habit
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-[var(--color-neutral-400)] italic">No habits added. Add at least one if Overview and Guidelines are blank.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-4 right-4 text-[var(--color-neutral-400)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--color-neutral-600)]">Habit Name *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-1.5 bg-white border border-[var(--color-neutral-300)] rounded-lg text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                            placeholder="e.g. 10-minute walk after dinner"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, "name", e.target.value)}
                            maxLength={150}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--color-neutral-600)]">Target Frequency</label>
                          <div className="flex gap-2">
                            <select
                              className="flex-1 px-3 py-1.5 bg-white border border-[var(--color-neutral-300)] rounded-lg text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                              value={item.targetFrequency}
                              onChange={(e) => handleItemChange(index, "targetFrequency", e.target.value)}
                            >
                              <option value="Daily">Daily</option>
                              <option value="TimesPerWeek">Times per week</option>
                              <option value="NoSpecificTarget">No specific target</option>
                            </select>

                            {item.targetFrequency === "TimesPerWeek" && (
                              <input
                                type="number"
                                required
                                min={1}
                                max={7}
                                className="w-16 px-2 py-1.5 bg-white border border-[var(--color-neutral-300)] rounded-lg text-sm outline-none text-center focus:ring-1 focus:ring-[var(--color-primary-500)]"
                                placeholder="1-7"
                                value={item.targetTimesPerWeek || ""}
                                onChange={(e) => handleItemChange(index, "targetTimesPerWeek", e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--color-neutral-600)]">Description (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 bg-white border border-[var(--color-neutral-300)] rounded-lg text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                          placeholder="Provide details or context on how to perform this habit..."
                          value={item.description || ""}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          maxLength={1000}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guidelines List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[var(--color-neutral-800)] text-sm sm:text-base">Guidelines</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddGuideline} className="h-8">
                  <Plus className="w-4 h-4 mr-1" /> Add Guideline
                </Button>
              </div>

              {guidelines.length === 0 ? (
                <p className="text-xs text-[var(--color-neutral-400)] italic">No guidelines added.</p>
              ) : (
                <div className="space-y-2">
                  {guidelines.map((g, index) => (
                    <div key={g.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        className="flex-1 px-3 py-1.5 border border-[var(--color-neutral-300)] rounded-lg text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                        placeholder="e.g. Small and consistent beats big and occasional."
                        value={g.text}
                        onChange={(e) => handleGuidelineChange(g.id, e.target.value)}
                        maxLength={500}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGuideline(g.id)}
                        className="text-[var(--color-neutral-400)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--color-neutral-200)]">
              <Button type="submit" disabled={isPending}>
                Save Plan
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode("view")} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Plan Management Section */}
      {!activePlan ? (
        <EmptyState
          icon={<CheckSquare className="w-12 h-12 text-[var(--color-neutral-400)]" />}
          title="No habits set up yet"
          description="Create a keystone habit plan for this client to guide their routine."
          action={
            <Button onClick={handleStartCreate}>
              Create Habit Plan
            </Button>
          }
        />
      ) : (
        <Card className="shadow-sm border-[var(--color-neutral-200)] bg-white">
          <CardHeader className="border-b border-[var(--color-neutral-100)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl">{activePlan.title}</CardTitle>
                <CardDescription>Active Habit Plan</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={handleStartNewPlan}>
                  Start New Plan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {activePlan.overview && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[var(--color-neutral-400)] uppercase tracking-wider">Overview</h4>
                <p className="text-sm text-[var(--color-neutral-600)] whitespace-pre-wrap">{activePlan.overview}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[var(--color-neutral-400)] uppercase tracking-wider">Habits</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {activePlan.items.filter(item => item.status === "active").map(item => {
                  const freq =
                    item.targetFrequency === "Daily"
                      ? "Daily"
                      : item.targetFrequency === "TimesPerWeek"
                      ? `${item.targetTimesPerWeek}x/week`
                      : "No specific target";
                  return (
                    <div key={item.id} className="p-3.5 rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-sm text-[var(--color-neutral-800)]">{item.name}</span>
                        <span className="text-[10px] font-bold text-[var(--color-primary-700)] bg-[var(--color-primary-50)] border border-[var(--color-primary-100)] px-2 py-0.5 rounded-full flex-shrink-0">
                          {freq}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-[var(--color-neutral-500)] mt-1.5">{item.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {activePlan.guidelines.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--color-neutral-400)] uppercase tracking-wider">Guidelines</h4>
                <ul className="list-disc list-inside text-sm text-[var(--color-neutral-600)] space-y-1.5">
                  {activePlan.guidelines.map(g => (
                    <li key={g.id}>{g.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completion History Section */}
      <Card className="shadow-sm border-[var(--color-neutral-200)]">
        <CardHeader className="border-b border-[var(--color-neutral-100)] py-4">
          <CardTitle className="text-lg font-bold">Completions History</CardTitle>
          <CardDescription>Read-only review of client routine adherence over time.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Period Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-neutral-50)] p-4 rounded-xl border border-[var(--color-neutral-200)]">
            <PeriodSelector 
              period={period}
              onPeriodChange={(p, s, e) => {
                setPeriod(p as any)
                setHistoryStart(s)
                setHistoryEnd(e)
              }}
              startDate={historyStart}
              onStartDateChange={setHistoryStart}
              endDate={historyEnd}
              onEndDateChange={setHistoryEnd}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--color-neutral-800)]">Active Plan Habits</h3>
            {currentHabits.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-neutral-400)] border border-dashed rounded-xl">
                No active habits in the current plan.
              </div>
            ) : (
              <div className="space-y-4">{currentHabits.map(renderHistoryRow)}</div>
            )}
          </div>

          {/* Past Habits */}
          <div className="border border-[var(--color-neutral-200)] rounded-lg bg-white overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between p-4 bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] transition-colors"
              onClick={() => setPastExpanded(!pastExpanded)}
            >
              <div className="flex items-center gap-2 text-[var(--color-neutral-800)] font-semibold">
                <History className="w-5 h-5 text-[var(--color-neutral-500)]" />
                Past Habits ({pastHabits.length})
              </div>
              <ChevronRight className={`w-5 h-5 text-[var(--color-neutral-400)] transition-transform duration-200 ${pastExpanded ? "rotate-90" : ""}`} />
            </button>
            {pastExpanded && (
              <div className="p-4 bg-[var(--color-neutral-50)] border-t border-[var(--color-neutral-200)] space-y-4">
                {pastHabits.length === 0 ? (
                  <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No past habits found.</p>
                ) : (
                  pastHabits.map(renderHistoryRow)
                )}
              </div>
            )}
          </div>

          {/* Plan History */}
          <div className="border border-[var(--color-neutral-200)] rounded-lg bg-white overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between p-4 bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] transition-colors"
              onClick={() => setPlanHistoryExpanded(!planHistoryExpanded)}
            >
              <div className="flex items-center gap-2 text-[var(--color-neutral-800)] font-semibold">
                <History className="w-5 h-5 text-[var(--color-neutral-500)]" />
                Plan History ({archivedPlans.length})
              </div>
              <ChevronRight className={`w-5 h-5 text-[var(--color-neutral-400)] transition-transform duration-200 ${planHistoryExpanded ? "rotate-90" : ""}`} />
            </button>
            {planHistoryExpanded && (
              <div className="p-4 bg-[var(--color-neutral-50)] border-t border-[var(--color-neutral-200)] space-y-4">
                {archivedPlans.length === 0 ? (
                  <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No archived plans.</p>
                ) : (
                  archivedPlans.map(plan => (
                    <Card key={plan.id} className="shadow-sm border-[var(--color-neutral-200)]">
                      <CardHeader className="py-3 bg-white border-b border-[var(--color-neutral-100)]">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-bold text-[var(--color-neutral-800)]">{plan.title}</CardTitle>
                          <span className="text-xs text-[var(--color-neutral-500)]">
                            Archived: {new Date(plan.archivedAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 bg-white">
                        {plan.overview && <p className="text-sm text-[var(--color-neutral-600)] whitespace-pre-wrap">{plan.overview}</p>}
                        
                        <div>
                          <p className="text-xs font-bold text-[var(--color-neutral-700)] mb-1">Habits:</p>
                          <ul className="list-disc list-inside text-sm text-[var(--color-neutral-600)] space-y-1">
                            {plan.items.map((item: any) => {
                              const frequencyLabel =
                                item.targetFrequency === "Daily"
                                  ? "Daily"
                                  : item.targetFrequency === "TimesPerWeek"
                                  ? `${item.targetTimesPerWeek}x/week`
                                  : "No specific target";
                              return (
                                <li key={item.id}>
                                  <span className="font-semibold text-[var(--color-neutral-800)]">{item.name}</span> ({frequencyLabel})
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {plan.guidelines.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-[var(--color-neutral-700)] mb-1">Guidelines:</p>
                            <ul className="list-disc list-inside text-sm text-[var(--color-neutral-600)] space-y-0.5">
                              {plan.guidelines.map((g: any) => (
                                <li key={g.id}>{g.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
