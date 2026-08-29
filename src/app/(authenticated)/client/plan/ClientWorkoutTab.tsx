"use client";

import { useState } from "react";
import { WorkoutPlanWithDetails, WorkoutPlanView } from "@/components/plan/WorkoutPlanView";
import { EmptyState } from "@/components/ui/states";
import { Dumbbell, History, Plus, Edit2, Trash2, CheckSquare } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutLog } from "@prisma/client";
import { LogWorkoutDialog } from "./LogWorkoutDialog";
import { deleteWorkoutLog } from "./workout-actions";
import { useRouter } from "next/navigation";

export function ClientWorkoutTab({ 
  workoutPlans, 
  isConnected,
  workoutLogs 
}: { 
  workoutPlans: WorkoutPlanWithDetails[], 
  isConnected: boolean,
  workoutLogs: WorkoutLog[]
}) {
  const router = useRouter();
  const activePlan = workoutPlans.find(p => p.status === "ACTIVE");
  const archivedPlans = workoutPlans.filter(p => p.status === "ARCHIVED").sort((a, b) => 
    new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime()
  );
  
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedArchivedId, setExpandedArchivedId] = useState<string | null>(null);
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteLog = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this workout log?")) {
      setIsDeleting(id);
      await deleteWorkoutLog(id);
      setIsDeleting(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* Plan Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-neutral-200)]">
          <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">Your Workout Plan</h2>
        </div>

        {!isConnected ? (
          <EmptyState 
            icon={<Dumbbell className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
            title="Not currently connected to a coach" 
            description="Connect with a coach to receive structured workout plans." 
          />
        ) : !activePlan ? (
          <EmptyState 
            icon={<Dumbbell className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
            title="Your coach hasn't created a workout plan yet" 
            description="When your coach creates a workout plan for you, it will appear here." 
          />
        ) : (
          <WorkoutPlanView plan={activePlan} />
        )}

        {/* Plan History Section */}
        {isConnected && (
          <div className="border border-[var(--color-neutral-200)] rounded-lg bg-white overflow-hidden shadow-sm mt-8">
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
        )}
      </div>

      <hr className="border-[var(--color-neutral-200)]" />

      {/* Log Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-neutral-200)]">
          <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">Your Workout Logs</h2>
          <Button onClick={() => setIsLogDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Workout
          </Button>
        </div>

        {workoutLogs.length === 0 ? (
          <EmptyState 
            icon={<CheckSquare className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
            title="No workouts logged yet" 
            description="Log your first workout to start tracking your progress." 
          />
        ) : (
          <div className="space-y-4">
            {workoutLogs.map((log) => (
              <div key={log.id} className="p-4 border border-[var(--color-neutral-200)] rounded-lg bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h4 className="font-semibold text-lg text-[var(--color-neutral-900)] flex items-center gap-2">
                    {log.title}
                    {log.source === "plan" && (
                      <span className="text-xs uppercase bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-100)] px-2 py-0.5 rounded-sm font-bold">
                        From Plan
                      </span>
                    )}
                  </h4>
                  <div className="flex gap-3 mt-1 text-sm text-[var(--color-neutral-500)] font-medium">
                    <span>{new Date(log.date + "T12:00:00Z").toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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
                    <p className="mt-3 text-sm text-[var(--color-neutral-700)] whitespace-pre-wrap bg-[var(--color-neutral-50)] p-3 rounded-md border border-[var(--color-neutral-100)]">
                      {log.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-end md:self-start mt-2 md:mt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[var(--color-neutral-500)] hover:text-red-600"
                    onClick={() => handleDeleteLog(log.id)}
                    disabled={isDeleting === log.id}
                  >
                    {isDeleting === log.id ? "..." : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LogWorkoutDialog 
        open={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
        activePlan={activePlan}
      />
    </div>
  );
}
