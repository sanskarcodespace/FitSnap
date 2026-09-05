"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createWorkoutPlan, updateWorkoutPlan, WorkoutPlanInput } from "./plan/workout-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { WorkoutPlanWithDetails } from "@/components/plan/WorkoutPlanView";

type WorkoutPlanFormProps = {
  connectionId: string;
  initialData?: WorkoutPlanWithDetails | null;
  isStartingNewPlan?: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

export function WorkoutPlanForm({ connectionId, initialData, isStartingNewPlan, onCancel, onSuccess }: WorkoutPlanFormProps) {
  const router = useRouter();
  
  const [title, setTitle] = useState(initialData?.title || "");
  const [overview, setOverview] = useState(initialData?.overview || "");
  
  const [sessions, setSessions] = useState<{ id: string; name: string; description: string; exercises: { id: string; name: string; setsRepsDescription: string; notes: string }[] }[]>(
    initialData?.sessions.map(s => ({
      id: s.id || crypto.randomUUID(),
      name: s.name,
      description: s.description || "",
      exercises: s.exercises.map(e => ({
        id: e.id || crypto.randomUUID(),
        name: e.name,
        setsRepsDescription: e.setsRepsDescription || "",
        notes: e.notes || ""
      }))
    })) || []
  );

  const [guidelines, setGuidelines] = useState<{ id: string; text: string }[]>(
    initialData?.guidelines.map(g => ({
      id: g.id || crypto.randomUUID(),
      text: g.text
    })) || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSession = () => {
    setSessions([...sessions, { id: crypto.randomUUID(), name: "", description: "", exercises: [] }]);
  };

  const handleRemoveSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleSessionChange = (id: string, field: string, value: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddExercise = (sessionId: string) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: [...s.exercises, { id: crypto.randomUUID(), name: "", setsRepsDescription: "", notes: "" }] }
        : s
    ));
  };

  const handleRemoveExercise = (sessionId: string, exerciseId: string) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: s.exercises.filter(e => e.id !== exerciseId) }
        : s
    ));
  };

  const handleExerciseChange = (sessionId: string, exerciseId: string, field: string, value: string) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, exercises: s.exercises.map(e => e.id === exerciseId ? { ...e, [field]: value } : e) }
        : s
    ));
  };

  const handleAddGuideline = () => {
    setGuidelines([...guidelines, { id: crypto.randomUUID(), text: "" }]);
  };

  const handleRemoveGuideline = (id: string) => {
    setGuidelines(guidelines.filter(g => g.id !== id));
  };

  const handleGuidelineChange = (id: string, value: string) => {
    setGuidelines(guidelines.map(g => g.id === id ? { ...g, text: value } : g));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!title.trim()) throw new Error("Title is required");
      if (title.length > 100) throw new Error("Title is too long (max 100 characters)");
      
      const hasOverview = overview.trim().length > 0;
      const hasSessions = sessions.length > 0;
      const hasGuidelines = guidelines.length > 0;

      if (!hasOverview && !hasSessions && !hasGuidelines) {
        throw new Error("Plan must have some content (overview, sessions, or guidelines)");
      }

      if (overview.length > 2000) throw new Error("Overview is too long (max 2000 characters)");
      
      for (const s of sessions) {
        if (!s.name.trim()) throw new Error("Session name cannot be empty");
        if (s.name.length > 100) throw new Error("Session name is too long");
        if (s.description && s.description.length > 1000) throw new Error("Session description is too long");
        for (const ex of s.exercises) {
          if (!ex.name.trim()) throw new Error("Exercise name cannot be empty");
          if (ex.name.length > 100) throw new Error("Exercise name is too long");
          if (ex.setsRepsDescription && ex.setsRepsDescription.length > 200) throw new Error("Sets/Reps description is too long");
          if (ex.notes && ex.notes.length > 500) throw new Error("Exercise notes are too long");
        }
      }

      for (const g of guidelines) {
        if (!g.text.trim()) throw new Error("Guideline text cannot be empty");
        if (g.text.length > 500) throw new Error("Guideline is too long");
      }

      const payload: WorkoutPlanInput = {
        title: title.trim(),
        overview: overview.trim() || undefined,
        sessions: sessions.map(s => ({
          name: s.name.trim(),
          description: s.description.trim() || undefined,
          exercises: s.exercises.map(ex => ({
            name: ex.name.trim(),
            setsRepsDescription: ex.setsRepsDescription.trim() || undefined,
            notes: ex.notes.trim() || undefined
          }))
        })),
        guidelines: guidelines.map(g => ({ text: g.text.trim() }))
      };

      let result;
      if (initialData) {
        result = await updateWorkoutPlan(initialData.id, payload);
      } else if (isStartingNewPlan) {
        const { archiveAndStartNewWorkoutPlan } = await import("./plan/workout-actions");
        result = await archiveAndStartNewWorkoutPlan(connectionId, payload);
      } else {
        result = await createWorkoutPlan(connectionId, payload);
      }

      if (!result.success) {
        throw new Error(result.error || "An unknown error occurred");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Plan Title <span className="text-red-500">*</span></Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Strength & Conditioning Phase 1" 
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overview">Overview / Focus</Label>
            <Textarea 
              id="overview" 
              value={overview} 
              onChange={(e) => setOverview(e.target.value)} 
              placeholder="General approach, goals, or schedule for the client..."
              maxLength={2000}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Workout Sessions</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddSession}>
            <Plus className="w-4 h-4 mr-2" /> Add Session
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No sessions added yet.</p>
          ) : (
            sessions.map((session, sIndex) => (
              <div key={session.id} className="p-4 border border-[var(--color-neutral-200)] rounded-lg bg-[var(--color-neutral-50)] space-y-6 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-[var(--color-neutral-400)] hover:text-red-600"
                  onClick={() => handleRemoveSession(session.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="space-y-4 mr-8">
                  <h4 className="font-semibold text-lg text-[var(--color-neutral-800)] flex items-center gap-2">
                    Session {sIndex + 1}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Session Name <span className="text-red-500">*</span></Label>
                      <Input 
                        value={session.name} 
                        onChange={(e) => handleSessionChange(session.id, "name", e.target.value)} 
                        placeholder="e.g. Upper Body Power" 
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input 
                        value={session.description} 
                        onChange={(e) => handleSessionChange(session.id, "description", e.target.value)} 
                        placeholder="e.g. Focus on explosive movements" 
                        maxLength={1000}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 border-t border-[var(--color-neutral-200)] pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Exercises</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={() => handleAddExercise(session.id)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Exercise
                    </Button>
                  </div>

                  {session.exercises.length === 0 ? (
                    <p className="text-sm text-[var(--color-neutral-500)] py-2">No exercises added to this session.</p>
                  ) : (
                    <div className="space-y-3">
                      {session.exercises.map((exercise, eIndex) => (
                        <div key={exercise.id} className="flex flex-col md:flex-row gap-3 bg-[var(--background)] p-3 rounded-md border border-[var(--color-neutral-200)] relative">
                          <div className="flex-1 space-y-3 mr-6 md:mr-0">
                            <div className="flex flex-col md:flex-row gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Exercise Name <span className="text-red-500">*</span></Label>
                                <Input 
                                  value={exercise.name}
                                  onChange={(e) => handleExerciseChange(session.id, exercise.id, "name", e.target.value)}
                                  placeholder="e.g. Barbell Bench Press"
                                  maxLength={100}
                                  required
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Sets / Reps / Rest</Label>
                                <Input 
                                  value={exercise.setsRepsDescription}
                                  onChange={(e) => handleExerciseChange(session.id, exercise.id, "setsRepsDescription", e.target.value)}
                                  placeholder="e.g. 4 sets of 5-8 reps, 2 min rest"
                                  maxLength={200}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Form Notes (Optional)</Label>
                              <Input 
                                value={exercise.notes}
                                onChange={(e) => handleExerciseChange(session.id, exercise.id, "notes", e.target.value)}
                                placeholder="e.g. Control the eccentric phase, pause at bottom"
                                maxLength={500}
                              />
                            </div>
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2 md:relative md:top-0 md:right-0 md:mt-[22px] text-[var(--color-neutral-400)] hover:text-red-600 self-start"
                            onClick={() => handleRemoveExercise(session.id, exercise.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Guidelines & Rules</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddGuideline}>
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {guidelines.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No guidelines added yet.</p>
          ) : (
            guidelines.map((guideline, index) => (
              <div key={guideline.id} className="flex gap-2 items-start">
                <span className="mt-2.5 text-[var(--color-neutral-400)] text-sm">{index + 1}.</span>
                <Input 
                  value={guideline.text} 
                  onChange={(e) => handleGuidelineChange(guideline.id, e.target.value)} 
                  placeholder="e.g. Warm up dynamically before every session" 
                  maxLength={500}
                  required
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-[var(--color-neutral-400)] hover:text-red-600 mt-0.5"
                  onClick={() => handleRemoveGuideline(guideline.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4 border-t border-[var(--color-neutral-200)]">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}
