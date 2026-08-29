"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createYogaPlan, updateYogaPlan, YogaPlanInput } from "./plan/yoga-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { YogaPlanWithDetails } from "@/components/plan/YogaPlanView";

type YogaPlanFormProps = {
  connectionId: string;
  initialData?: YogaPlanWithDetails | null;
  isStartingNewPlan?: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

const VALID_STYLES = ["Hatha", "Vinyasa", "Yin", "Restorative", "Power", "Other"];

export function YogaPlanForm({ connectionId, initialData, isStartingNewPlan, onCancel, onSuccess }: YogaPlanFormProps) {
  const router = useRouter();
  
  const [title, setTitle] = useState(initialData?.title || "");
  const [overview, setOverview] = useState(initialData?.overview || "");
  
  const [sequences, setSequences] = useState<{ id: string; name: string; description: string; style: string; durationGuidance: string; poses: { id: string; name: string; holdOrRepGuidance: string; notes: string }[] }[]>(
    initialData?.sequences.map(s => ({
      id: s.id || crypto.randomUUID(),
      name: s.name,
      description: s.description || "",
      style: s.style || "",
      durationGuidance: s.durationGuidance || "",
      poses: s.poses.map(p => ({
        id: p.id || crypto.randomUUID(),
        name: p.name,
        holdOrRepGuidance: p.holdOrRepGuidance || "",
        notes: p.notes || ""
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

  const handleAddSequence = () => {
    setSequences([...sequences, { id: crypto.randomUUID(), name: "", description: "", style: "", durationGuidance: "", poses: [] }]);
  };

  const handleRemoveSequence = (id: string) => {
    setSequences(sequences.filter(s => s.id !== id));
  };

  const handleSequenceChange = (id: string, field: string, value: string) => {
    setSequences(sequences.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddPose = (sequenceId: string) => {
    setSequences(sequences.map(s => 
      s.id === sequenceId 
        ? { ...s, poses: [...s.poses, { id: crypto.randomUUID(), name: "", holdOrRepGuidance: "", notes: "" }] }
        : s
    ));
  };

  const handleRemovePose = (sequenceId: string, poseId: string) => {
    setSequences(sequences.map(s => 
      s.id === sequenceId 
        ? { ...s, poses: s.poses.filter(p => p.id !== poseId) }
        : s
    ));
  };

  const handlePoseChange = (sequenceId: string, poseId: string, field: string, value: string) => {
    setSequences(sequences.map(s => 
      s.id === sequenceId 
        ? { ...s, poses: s.poses.map(p => p.id === poseId ? { ...p, [field]: value } : p) }
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
      const hasSequences = sequences.length > 0;
      const hasGuidelines = guidelines.length > 0;

      if (!hasOverview && !hasSequences && !hasGuidelines) {
        throw new Error("Plan must have some content (overview, sequences, or guidelines)");
      }

      if (overview.length > 2000) throw new Error("Overview is too long (max 2000 characters)");
      
      for (const s of sequences) {
        if (!s.name.trim()) throw new Error("Sequence name cannot be empty");
        if (s.name.length > 100) throw new Error("Sequence name is too long");
        if (s.description && s.description.length > 1000) throw new Error("Sequence description is too long");
        if (s.style && !VALID_STYLES.includes(s.style)) throw new Error("Invalid style");
        if (s.durationGuidance && s.durationGuidance.length > 100) throw new Error("Duration guidance is too long");
        
        for (const p of s.poses) {
          if (!p.name.trim()) throw new Error("Pose name cannot be empty");
          if (p.name.length > 100) throw new Error("Pose name is too long");
          if (p.holdOrRepGuidance && p.holdOrRepGuidance.length > 200) throw new Error("Hold/Rep guidance is too long");
          if (p.notes && p.notes.length > 500) throw new Error("Pose notes are too long");
        }
      }

      for (const g of guidelines) {
        if (!g.text.trim()) throw new Error("Guideline text cannot be empty");
        if (g.text.length > 500) throw new Error("Guideline is too long");
      }

      const payload: YogaPlanInput = {
        title: title.trim(),
        overview: overview.trim() || undefined,
        sequences: sequences.map(s => ({
          name: s.name.trim(),
          description: s.description.trim() || undefined,
          style: s.style || undefined,
          durationGuidance: s.durationGuidance.trim() || undefined,
          poses: s.poses.map(p => ({
            name: p.name.trim(),
            holdOrRepGuidance: p.holdOrRepGuidance.trim() || undefined,
            notes: p.notes.trim() || undefined
          }))
        })),
        guidelines: guidelines.map(g => ({ text: g.text.trim() }))
      };

      let result;
      if (initialData) {
        result = await updateYogaPlan(connectionId, initialData.id, payload);
      } else if (isStartingNewPlan) {
        const { archiveAndStartNewYogaPlan } = await import("./plan/yoga-actions");
        result = await archiveAndStartNewYogaPlan(connectionId);
        if (result.success) {
          result = await createYogaPlan(connectionId, payload);
        }
      } else {
        result = await createYogaPlan(connectionId, payload);
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
              placeholder="e.g. 4-Week Beginner Flow" 
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
          <CardTitle className="text-xl">Yoga Sequences</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddSequence}>
            <Plus className="w-4 h-4 mr-2" /> Add Sequence
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {sequences.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No sequences added yet.</p>
          ) : (
            sequences.map((sequence, sIndex) => (
              <div key={sequence.id} className="p-4 border border-[var(--color-neutral-200)] rounded-lg bg-[var(--color-neutral-50)] space-y-6 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-[var(--color-neutral-400)] hover:text-red-600"
                  onClick={() => handleRemoveSequence(sequence.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="space-y-4 mr-8">
                  <h4 className="font-semibold text-lg text-[var(--color-neutral-800)] flex items-center gap-2">
                    Sequence {sIndex + 1}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sequence Name <span className="text-red-500">*</span></Label>
                      <Input 
                        value={sequence.name} 
                        onChange={(e) => handleSequenceChange(sequence.id, "name", e.target.value)} 
                        placeholder="e.g. Morning Flow" 
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Style (Optional)</Label>
                      <select
                        className="w-full px-3 py-2 border border-[var(--color-neutral-200)] rounded-md text-sm"
                        value={sequence.style}
                        onChange={(e) => handleSequenceChange(sequence.id, "style", e.target.value)}
                      >
                        <option value="">Select a style</option>
                        {VALID_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input 
                        value={sequence.description} 
                        onChange={(e) => handleSequenceChange(sequence.id, "description", e.target.value)} 
                        placeholder="e.g. Focus on hips and lower back" 
                        maxLength={1000}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration Guidance (Optional)</Label>
                      <Input 
                        value={sequence.durationGuidance} 
                        onChange={(e) => handleSequenceChange(sequence.id, "durationGuidance", e.target.value)} 
                        placeholder="e.g. 20-30 mins" 
                        maxLength={100}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 border-t border-[var(--color-neutral-200)] pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Poses</Label>
                    <Button type="button" variant="secondary" size="sm" onClick={() => handleAddPose(sequence.id)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Pose
                    </Button>
                  </div>

                  {sequence.poses.length === 0 ? (
                    <p className="text-sm text-[var(--color-neutral-500)] py-2">No poses added to this sequence.</p>
                  ) : (
                    <div className="space-y-3">
                      {sequence.poses.map((pose, pIndex) => (
                        <div key={pose.id} className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-md border border-[var(--color-neutral-200)] relative">
                          <div className="flex-1 space-y-3 mr-6 md:mr-0">
                            <div className="flex flex-col md:flex-row gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Pose Name <span className="text-red-500">*</span></Label>
                                <Input 
                                  value={pose.name}
                                  onChange={(e) => handlePoseChange(sequence.id, pose.id, "name", e.target.value)}
                                  placeholder="e.g. Downward Dog"
                                  maxLength={100}
                                  required
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Hold/Rep Guidance (Optional)</Label>
                                <Input 
                                  value={pose.holdOrRepGuidance}
                                  onChange={(e) => handlePoseChange(sequence.id, pose.id, "holdOrRepGuidance", e.target.value)}
                                  placeholder="e.g. 5 breaths"
                                  maxLength={200}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Form Notes (Optional)</Label>
                              <Input 
                                value={pose.notes}
                                onChange={(e) => handlePoseChange(sequence.id, pose.id, "notes", e.target.value)}
                                placeholder="e.g. Keep spine straight, bend knees if needed"
                                maxLength={500}
                              />
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="absolute top-2 right-2 md:relative md:top-0 md:right-0 text-[var(--color-neutral-400)] hover:text-red-600"
                            onClick={() => handleRemovePose(sequence.id, pose.id)}
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
          <CardTitle className="text-xl">Guidelines</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddGuideline}>
            <Plus className="w-4 h-4 mr-2" /> Add Guideline
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {guidelines.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No guidelines added yet.</p>
          ) : (
            <div className="space-y-3">
              {guidelines.map((guideline, index) => (
                <div key={guideline.id} className="flex gap-3 items-start">
                  <span className="text-[var(--color-neutral-400)] font-medium pt-2">{index + 1}.</span>
                  <div className="flex-1">
                    <Textarea 
                      value={guideline.text} 
                      onChange={(e) => handleGuidelineChange(guideline.id, e.target.value)} 
                      placeholder="e.g. Do these sequences 3x a week on non-consecutive days." 
                      maxLength={500}
                      required
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-[var(--color-neutral-400)] hover:text-red-600 mt-1"
                    onClick={() => handleRemoveGuideline(guideline.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
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
