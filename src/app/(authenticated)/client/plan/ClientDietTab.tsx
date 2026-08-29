"use client";

import { useState } from "react";
import { DietPlanWithDetails, DietPlanView } from "@/components/plan/DietPlanView";
import { EmptyState } from "@/components/ui/states";
import { Utensils, History } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ClientDietTab({ dietPlans, isConnected }: { dietPlans: DietPlanWithDetails[], isConnected: boolean }) {
  const activePlan = dietPlans.find(p => p.status === "ACTIVE");
  const archivedPlans = dietPlans.filter(p => p.status === "ARCHIVED").sort((a, b) => 
    new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime()
  );
  
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedArchivedId, setExpandedArchivedId] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <EmptyState 
        icon={<Utensils className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
        title="Not currently connected to a coach" 
        description="Connect with a coach to receive structured diet plans." 
      />
    );
  }

  return (
    <div className="space-y-8">
      {!activePlan ? (
        <EmptyState 
          icon={<Utensils className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
          title="Your coach hasn't created a diet plan yet" 
          description="When your coach creates a diet plan for you, it will appear here." 
        />
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--color-neutral-900)] pb-4 border-b border-[var(--color-neutral-200)]">Active Diet Plan</h2>
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
