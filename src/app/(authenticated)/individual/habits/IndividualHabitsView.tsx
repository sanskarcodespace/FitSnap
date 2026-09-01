"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "@/components/ui/period-selector";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/states";
import { CheckSquare, Calendar, ChevronLeft, ChevronRight, History, Sparkles, AlertCircle, Edit, Check, Plus, Trash2 } from "lucide-react";
import { toggleIndividualHabit, saveIndividualHabitNote, addIndividualHabit, removeIndividualHabit } from "./actions";

interface HabitCompletion {
  id: string;
  habitPlanItemId: string;
  habitNameSnapshot: string;
  date: string;
  note: string | null;
}

interface HabitItem {
  id: string;
  name: string;
  description: string | null;
  targetFrequency: string;
  targetTimesPerWeek: number | null;
  status: string; // "active" | "removed"
  planId: string;
  planTitle: string;
  planStatus: string;
  coachName: string;
  completions: HabitCompletion[];
  isActiveInCurrentPlan: boolean;
}

interface IndividualHabitsViewProps {
  activePlan: any | null;
  allHabitItems: HabitItem[];
  allCompletions: HabitCompletion[];
  archivedPlans: any[];
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

export function IndividualHabitsView({
  activePlan,
  allHabitItems,
  allCompletions,
  archivedPlans
}: IndividualHabitsViewProps) {
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [period, setPeriod] = useState<"7" | "30" | "custom">("7");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [historyStart, setHistoryStart] = useState(thirtyDaysAgoStr);
  const [historyEnd, setHistoryEnd] = useState(todayStr);

  const handlePrevDate = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() - 1);
    const py = prev.getFullYear();
    const pm = String(prev.getMonth() + 1).padStart(2, "0");
    const pd = String(prev.getDate()).padStart(2, "0");
    setSelectedDate(`${py}-${pm}-${pd}`);
  };

  const handleNextDate = () => {
    if (selectedDate >= todayStr) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 1);
    const ny = next.getFullYear();
    const nm = String(next.getMonth() + 1).padStart(2, "0");
    const nd = String(next.getDate()).padStart(2, "0");
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const formatSelectedDate = () => {
    if (selectedDate === todayStr) return "Today";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === prev.toDateString()) return "Yesterday";
    return prev.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleToggle = (itemId: string, currentChecked: boolean) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await toggleIndividualHabit(itemId, selectedDate, !currentChecked);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to toggle completion");
      }
    });
  };

  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleStartEditNote = (itemId: string, existingNote: string | null) => {
    setEditingNoteItemId(itemId);
    setNoteText(existingNote || "");
  };

  const handleSaveNote = (itemId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await saveIndividualHabitNote(itemId, selectedDate, noteText);
      if (res.success) {
        setEditingNoteItemId(null);
      } else {
        setErrorMsg(res.error || "Failed to save note");
      }
    });
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await addIndividualHabit(newHabitName.trim(), "", "Daily", null);
      if (res.success) {
        setNewHabitName("");
        setIsAdding(false);
      } else {
        setErrorMsg(res.error || "Failed to add habit");
      }
    });
  };

  const handleRemoveHabit = (itemId: string) => {
    if (!confirm("Are you sure you want to stop tracking this habit? Past data will still be saved.")) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await removeIndividualHabit(itemId);
      if (!res.success) setErrorMsg(res.error || "Failed to remove habit");
    });
  };

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
  const currentHabits = allHabitItems.filter(h => h.isActiveInCurrentPlan);
  const pastHabits = allHabitItems.filter(h => !h.isActiveInCurrentPlan);

  const [pastExpanded, setPastExpanded] = useState(false);

  const renderHistoryRow = (habit: HabitItem) => {
    const completionDates = habit.completions.map(c => c.date);
    const streak = calculateStreak(completionDates);

    const completionsInPeriod = habit.completions.filter(
      c => c.date >= rangeStart && c.date <= rangeEnd
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
              <p className="text-xs text-[var(--color-neutral-500)] mt-1.5">{habit.description}</p>
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

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            {historyDates.map(date => {
              const comp = completionsInPeriod.find(c => c.date === date);
              const isComp = !!comp;
              const [y, m, d] = date.split("-").map(Number);
              const dateLabel = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const tooltip = `${dateLabel}: ${isComp ? "Completed" : "Not Completed"}${comp?.note ? ` (${comp.note})` : ""}`;

              return (
                <div
                  key={date}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all cursor-pointer relative group ${
                    isComp
                      ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)]"
                      : "bg-transparent border-[var(--color-neutral-300)]"
                  }`}
                  title={tooltip}
                />
              );
            })}
          </div>
          {completionsInPeriod.some(c => c.note) && (
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-2.5 border border-[var(--color-neutral-200)] mt-2">
              <p className="text-xs font-bold text-[var(--color-neutral-700)] mb-1">Notes in this period:</p>
              <ul className="space-y-1">
                {completionsInPeriod.filter(c => c.note).map(c => {
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

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="bg-white border border-[var(--color-neutral-200)] shadow-sm">
          <TabsTrigger value="today">Today's Habits</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* TODAY TAB */}
        <TabsContent value="today" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
            <Button variant="outline" size="sm" onClick={handlePrevDate}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="font-bold text-[var(--color-neutral-800)] flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-[var(--color-neutral-500)]" />
              {formatSelectedDate()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDate}
              disabled={selectedDate >= todayStr}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {currentHabits.map((item: any) => {
              const comp = allCompletions.find(c => c.habitPlanItemId === item.id && c.date === selectedDate);
              const isChecked = !!comp;
              
              return (
                <div
                  key={item.id}
                  className={`p-4 bg-white rounded-xl border transition-all shadow-sm ${
                    isChecked ? "border-[var(--color-primary-200)] bg-[var(--color-primary-25)]" : "border-[var(--color-neutral-200)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        role="checkbox"
                        aria-checked={isChecked}
                        disabled={isPending}
                        onClick={() => handleToggle(item.id, isChecked)}
                        className={`mt-0.5 relative after:absolute after:-inset-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white"
                            : "bg-white border-[var(--color-neutral-300)] hover:border-[var(--color-primary-400)] text-transparent"
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3px]" />
                      </button>
                      <div className="flex-1">
                        <h3 className={`font-bold transition-all text-sm sm:text-base ${
                          isChecked ? "text-[var(--color-primary-900)] line-through opacity-75" : "text-[var(--color-neutral-800)]"
                        }`}>
                          {item.name}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveHabit(item.id)}
                      disabled={isPending}
                      className="text-[var(--color-neutral-400)] hover:text-red-500 transition-colors"
                      title="Stop tracking this habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isChecked && (
                    <div className="mt-3 pl-9 border-t border-[var(--color-neutral-100)] pt-3">
                      {editingNoteItemId === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-[var(--color-neutral-300)] focus:ring-1 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] outline-none"
                            placeholder="Add a log note..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            maxLength={500}
                            disabled={isPending}
                          />
                          <Button size="sm" className="h-8 text-xs" disabled={isPending} onClick={() => handleSaveNote(item.id)}>Save</Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isPending} onClick={() => setEditingNoteItemId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          {comp.note && (
                            <p className="text-[var(--color-neutral-600)] italic">
                              Note: "{comp.note}"
                            </p>
                          )}
                          <button
                            className="text-[var(--color-primary-700)] font-semibold hover:underline flex items-center gap-1 p-2 -ml-2"
                            onClick={() => handleStartEditNote(item.id, comp.note)}
                          >
                            <Edit className="w-3 h-3" />
                            {comp.note ? "Edit Note" : "Add Note"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isAdding ? (
              <div className="p-4 bg-white rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
                <input
                  type="text"
                  placeholder="e.g. Drink 2L of water, Read 10 pages..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-[var(--color-neutral-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                  autoFocus
                  disabled={isPending}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddHabit()
                    if (e.key === 'Escape') setIsAdding(false)
                  }}
                />
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleAddHabit} disabled={isPending || !newHabitName.trim()}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[var(--color-neutral-300)] rounded-xl text-[var(--color-neutral-500)] hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-300)] hover:bg-[var(--color-primary-25)] transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Add New Habit
              </button>
            )}

            {!isAdding && currentHabits.length === 0 && (
              <EmptyState
                title="No habits yet"
                description="Start building consistency by adding your first habit."
                icon={<CheckSquare className="w-12 h-12 text-[var(--color-neutral-400)]" />}
                className="bg-transparent border-0"
              />
            )}
          </div>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
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
            <h3 className="text-lg font-bold text-[var(--color-neutral-800)] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[var(--color-primary-600)]" />
              Active Habits
            </h3>
            {currentHabits.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-neutral-500)] bg-white rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
                No active habits.
              </div>
            ) : (
              <div className="space-y-4">
                {currentHabits.map(renderHistoryRow)}
              </div>
            )}
          </div>

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
        </TabsContent>
      </Tabs>
    </div>
  );
}
