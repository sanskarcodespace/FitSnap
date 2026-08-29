"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { logWorkout, WorkoutLogInput } from "./workout-actions";
import { WorkoutPlanWithDetails, WorkoutPlanSessionWithExercises } from "@/components/plan/WorkoutPlanView";

type LogWorkoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePlan?: WorkoutPlanWithDetails | null;
};

export function LogWorkoutDialog({ open, onOpenChange, activePlan }: LogWorkoutDialogProps) {
  const [tab, setTab] = useState<"plan" | "custom">("custom");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Strength");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  
  // Date logic
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  useEffect(() => {
    if (open) {
      if (activePlan?.sessions && activePlan.sessions.length > 0) {
        setTab("plan");
      } else {
        setTab("custom");
      }
    } else {
      resetForm();
    }
  }, [open, activePlan]);

  const resetForm = () => {
    setSelectedSessionId("");
    setTitle("");
    setCategory("Strength");
    setDuration("");
    setNotes("");
    setDate(todayStr);
    setError(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const session = activePlan?.sessions.find(s => s.id === sessionId);
    if (session) {
      setTitle(session.name);
      setCategory("Strength"); // Default to strength for plan sessions, they can change it
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (tab === "plan" && !selectedSessionId) {
        throw new Error("Please select a session from your plan");
      }

      const durationMinutes = duration ? parseInt(duration, 10) : null;
      if (durationMinutes !== null && isNaN(durationMinutes)) {
        throw new Error("Duration must be a valid number");
      }

      const payload: WorkoutLogInput = {
        date,
        title: title.trim(),
        category,
        durationMinutes,
        notes: notes.trim() || null,
        source: tab,
        linkedWorkoutPlanSessionId: tab === "plan" ? selectedSessionId : null
      };

      const result = await logWorkout(payload);
      if (!result.success) {
        throw new Error(result.error || "Failed to log workout");
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPlanSessions = activePlan?.sessions && activePlan.sessions.length > 0;

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      title="Log a Workout"
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 mb-4">
          {error}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "plan" | "custom")} className="w-full">
        <TabsList className={`grid w-full ${hasPlanSessions ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {hasPlanSessions && (
            <TabsTrigger value="plan">From My Plan</TabsTrigger>
          )}
          <TabsTrigger value="custom">Custom Workout</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <TabsContent value="plan" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="session">Select Session <span className="text-red-500">*</span></Label>
              <select
                id="session"
                className="flex h-10 w-full rounded-md border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                value={selectedSessionId}
                onChange={(e) => handleSessionSelect(e.target.value)}
                required={tab === "plan"}
              >
                <option value="" disabled>Choose a session...</option>
                {activePlan?.sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label htmlFor="title">Workout Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning Run, CrossFit Class"
                maxLength={100}
                required={tab === "custom"}
              />
            </div>
          </TabsContent>

          {/* Shared Fields */}
          {(tab === "custom" || (tab === "plan" && selectedSessionId)) && (
            <>
              {tab === "plan" && (
                <div className="space-y-2">
                  <Label htmlFor="title-plan">Workout Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title-plan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                  <Input 
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={todayStr}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Minutes)</Label>
                <Input 
                  id="duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 45"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it feel? Any PRs?"
                  maxLength={1000}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-neutral-200)] mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Workout"}
            </Button>
          </div>
        </form>
      </Tabs>
    </Modal>
  );
}
