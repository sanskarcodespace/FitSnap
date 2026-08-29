"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { toggleHabitCompletion } from "./habits/actions";
import { Button } from "@/components/ui/button";

interface DashboardHabitsCardProps {
  habitItems: {
    id: string;
    name: string;
    targetFrequency: string;
    targetTimesPerWeek: number | null;
  }[];
  initialCompletions: {
    habitPlanItemId: string;
  }[];
  isConnected: boolean;
  hasPlan: boolean;
}

export function DashboardHabitsCard({
  habitItems,
  initialCompletions,
  isConnected,
  hasPlan
}: DashboardHabitsCardProps) {
  const [completions, setCompletions] = useState<string[]>(
    initialCompletions.map(c => c.habitPlanItemId)
  );
  const [isPending, startTransition] = useTransition();

  const handleToggle = (itemId: string) => {
    const isChecked = completions.includes(itemId);
    
    // Optimistic Update
    setCompletions(prev =>
      isChecked ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );

    startTransition(async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await toggleHabitCompletion(itemId, todayStr, !isChecked);
      if (!res.success) {
        // Rollback on error
        setCompletions(prev =>
          isChecked ? [...prev, itemId] : prev.filter(id => id !== itemId)
        );
      }
    });
  };

  const completedCount = completions.filter(id => habitItems.some(h => h.id === id)).length;
  const totalCount = habitItems.length;

  // Show up to 5 habits
  const displayedHabits = habitItems.slice(0, 5);
  const overflowCount = habitItems.length - 5;

  return (
    <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">Habits</h2>
        <Link href="/client/habits" className="text-xs font-semibold text-[var(--color-primary-700)] hover:underline">
          View All
        </Link>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-[var(--color-neutral-100)] rounded-lg px-4">
          <p className="text-sm text-[var(--color-neutral-500)]">Not connected to a coach.</p>
        </div>
      ) : !hasPlan ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-[var(--color-neutral-100)] rounded-lg px-4">
          <p className="text-sm text-[var(--color-neutral-500)]">Your coach hasn't set up any habits yet.</p>
        </div>
      ) : habitItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-[var(--color-neutral-100)] rounded-lg px-4">
          <p className="text-sm text-[var(--color-neutral-500)]">No habits active today.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            {displayedHabits.map(habit => {
              const isChecked = completions.includes(habit.id);
              const freqLabel =
                habit.targetFrequency === "Daily"
                  ? "Daily"
                  : habit.targetFrequency === "TimesPerWeek"
                  ? `${habit.targetTimesPerWeek}x/wk`
                  : "";

              return (
                <div key={habit.id} className="flex items-center gap-3">
                  <button
                    disabled={isPending}
                    onClick={() => handleToggle(habit.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isChecked
                        ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white"
                        : "bg-white border-[var(--color-neutral-300)] hover:border-[var(--color-primary-400)] text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isChecked ? "text-[var(--color-neutral-400)] line-through" : "text-[var(--color-neutral-700)] font-medium"}`}>
                      {habit.name}
                    </p>
                  </div>
                  {freqLabel && (
                    <span className="text-[10px] font-semibold text-[var(--color-neutral-400)] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {freqLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-[var(--color-neutral-150)] pt-3 mt-4 flex items-center justify-between text-xs text-[var(--color-neutral-500)] font-medium">
            <span>{completedCount} of {totalCount} completed today</span>
            {overflowCount > 0 && (
              <Link href="/client/habits" className="text-[var(--color-primary-700)] hover:underline">
                +{overflowCount} more · View All
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
