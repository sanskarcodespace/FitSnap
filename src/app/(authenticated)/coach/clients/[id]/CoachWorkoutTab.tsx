"use client";

import { useState } from "react";
import { WorkoutPlanWithDetails, WorkoutPlanView } from "@/components/plan/WorkoutPlanView";
import { WorkoutPlanForm } from "./WorkoutPlanForm";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Dumbbell, History, Plus } from "lucide-react";
import { archiveAndStartNewWorkoutPlan } from "./plan/workout-actions";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, CheckSquare } from "lucide-react";
import { WorkoutLog } from "@prisma/client";

export function CoachWorkoutTab({ 
  connectionId, 
  workoutPlans,
  recentLogs
}: { 
  connectionId: string, 
  workoutPlans: WorkoutPlanWithDetails[],
  recentLogs: WorkoutLog[]
}) {
  const router = useRouter();
  
  const activePlan = workoutPlans.find(p => p.status === "ACTIVE");
  const archivedPlans = workoutPlans.filter(p => p.status === "ARCHIVED").sort((a, b) => 
    new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime()
  );

  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedArchivedId, setExpandedArchivedId] = useState<string | null>(null);

  if (mode === "create") {
    return (
      <WorkoutPlanForm 
        connectionId={connectionId} 
        isStartingNewPlan={!!activePlan}
        onCancel={() => setMode("view")}
        onSuccess={() => setMode("view")}
      />
    );
  }

  if (mode === "edit" && activePlan) {
    return (
      <WorkoutPlanForm 
        connectionId={connectionId}
        initialData={activePlan}
        onCancel={() => setMode("view")}
        onSuccess={() => setMode("view")}
      />
    );
  }

  return (
    <div className="space-y-8">
      {!activePlan ? (
        <EmptyState 
          icon={<Dumbbell className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
          title="No workout plan created yet" 
          description="Create a structured workout plan for this client to guide their training." 
          action={
            <Button onClick={() => setMode("create")}>
              Create Workout Plan
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-neutral-200)]">
            <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">Active Workout Plan</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("edit")}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => {
                if (window.confirm("Are you sure you want to start a new workout plan? The current plan will be archived and moved to Plan History. This action cannot be undone.")) {
                  setMode("create");
                }
              }}>
                Start New Plan
              </Button>
            </div>
          </div>
          
          <WorkoutPlanView plan={activePlan} />
        </div>
      )}

      {/* Plan History Section */}
      <div className="border border-[var(--color-neutral-200)] rounded-lg bg-white overflow-hidden shadow-sm">
        <button 
          className="w-full flex items-center justify-between p-4 bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)] transition-colors"
          onClick={() => setHistoryExpanded(!historyExpanded)}
        >
          <div className="flex items-center gap-2 text-[var(--color-neutral-800)] font-semibold">
            <History className="w-5 h-5 text-[var(--color-neutral-500)]" />
            Plan History
          </div>
          {historyExpanded ? <ChevronDown className="w-5 h-5 text-[var(--color-neutral-500)]" /> : <ChevronRight className="w-5 h-5 text-[var(--color-neutral-500)]" />}
        </button>
        
        {historyExpanded && (
          <div className="p-4 border-t border-[var(--color-neutral-200)]">
            {archivedPlans.length === 0 ? (
              <p className="text-sm text-[var(--color-neutral-500)] italic">No previous plans</p>
            ) : (
              <div className="space-y-4">
                {archivedPlans.map((plan) => (
                  <div key={plan.id} className="border border-[var(--color-neutral-200)] rounded-lg overflow-hidden">
                    <button 
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-[var(--color-neutral-50)] transition-colors text-left"
                      onClick={() => setExpandedArchivedId(expandedArchivedId === plan.id ? null : plan.id)}
                    >
                      <div>
                        <p className="font-semibold text-[var(--color-neutral-800)]">{plan.title}</p>
                        <p className="text-xs text-[var(--color-neutral-500)]">
                          Archived on {plan.archivedAt ? new Date(plan.archivedAt).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                      {expandedArchivedId === plan.id ? <ChevronDown className="w-4 h-4 text-[var(--color-neutral-500)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-neutral-500)]" />}
                    </button>
                    {expandedArchivedId === plan.id && (
                      <div className="p-4 border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]">
                        <WorkoutPlanView plan={plan} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Client Logs Section */}
      <div className="border border-[var(--color-neutral-200)] rounded-lg bg-white overflow-hidden shadow-sm mt-8">
        <div className="p-4 border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[var(--color-neutral-500)]" />
          <h3 className="font-semibold text-[var(--color-neutral-800)]">Recent Client Workouts (Last 7 Days)</h3>
        </div>
        <div className="p-4">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)] italic">Client has not logged any workouts in the past 7 days.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-3 border border-[var(--color-neutral-200)] rounded-md flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-[var(--color-neutral-900)] flex items-center gap-2">
                      {log.title}
                      {log.source === "plan" && (
                        <span className="text-[10px] uppercase bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-100)] px-1.5 py-0.5 rounded-sm font-bold">
                          From Plan
                        </span>
                      )}
                    </h4>
                    <div className="flex gap-3 mt-1 text-sm text-[var(--color-neutral-500)]">
                      <span>{log.date}</span>
                      <span>•</span>
                      <span>{log.category}</span>
                      {log.durationMinutes && (
                        <>
                          <span>•</span>
                          <span>{log.durationMinutes} min</span>
                        </>
                      )}
                    </div>
                    {log.notes && (
                      <p className="mt-2 text-sm text-[var(--color-neutral-700)] italic">"{log.notes}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
