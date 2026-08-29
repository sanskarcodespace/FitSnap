"use client";

import { useState } from "react";
import { DietPlanWithDetails, DietPlanView } from "@/components/plan/DietPlanView";
import { DietPlanForm } from "./DietPlanForm";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Utensils, History, Plus } from "lucide-react";
import { archiveAndStartNewDietPlan } from "./plan/actions";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

export function CoachDietTab({ connectionId, dietPlans }: { connectionId: string, dietPlans: DietPlanWithDetails[] }) {
  const router = useRouter();
  
  const activePlan = dietPlans.find(p => p.status === "ACTIVE");
  const archivedPlans = dietPlans.filter(p => p.status === "ARCHIVED").sort((a, b) => 
    new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime()
  );

  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedArchivedId, setExpandedArchivedId] = useState<string | null>(null);

  if (mode === "create") {
    return (
      <DietPlanForm 
        connectionId={connectionId} 
        isStartingNewPlan={!!activePlan}
        onCancel={() => setMode("view")}
        onSuccess={() => setMode("view")}
      />
    );
  }

  if (mode === "edit" && activePlan) {
    return (
      <DietPlanForm 
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
          icon={<Utensils className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
          title="No diet plan created yet" 
          description="Create a structured diet plan for this client to guide their daily nutrition." 
          action={
            <Button onClick={() => setMode("create")}>
              Create Diet Plan
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-neutral-200)]">
            <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">Active Diet Plan</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("edit")}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => {
                if (window.confirm("Are you sure you want to start a new diet plan? The current plan will be archived and moved to Plan History. This action cannot be undone.")) {
                  setMode("create");
                }
              }}>
                Start New Plan
              </Button>
            </div>
          </div>
          
          <DietPlanView plan={activePlan} />
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
                        <DietPlanView plan={plan} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
