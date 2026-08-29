"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDietPlan, updateDietPlan, DietPlanInput } from "./plan/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { DietPlanWithDetails } from "@/components/plan/DietPlanView";

type DietPlanFormProps = {
  connectionId: string;
  initialData?: DietPlanWithDetails | null;
  isStartingNewPlan?: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

export function DietPlanForm({ connectionId, initialData, isStartingNewPlan, onCancel, onSuccess }: DietPlanFormProps) {
  const router = useRouter();
  
  const [title, setTitle] = useState(initialData?.title || "");
  const [overview, setOverview] = useState(initialData?.overview || "");
  const [mealGuidance, setMealGuidance] = useState<{ id: string; mealType: string; customLabel: string; guidanceText: string }[]>(
    initialData?.mealGuidance.map(mg => ({
      id: mg.id || crypto.randomUUID(),
      mealType: mg.mealType,
      customLabel: mg.customLabel || "",
      guidanceText: mg.guidanceText
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

  const handleAddMeal = () => {
    setMealGuidance([...mealGuidance, { id: crypto.randomUUID(), mealType: "Breakfast", customLabel: "", guidanceText: "" }]);
  };

  const handleRemoveMeal = (id: string) => {
    setMealGuidance(mealGuidance.filter(m => m.id !== id));
  };

  const handleMealChange = (id: string, field: string, value: string) => {
    setMealGuidance(mealGuidance.map(m => m.id === id ? { ...m, [field]: value } : m));
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
      // Basic validation matching server rules
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      if (title.length > 100) {
        throw new Error("Title is too long (max 100 characters)");
      }
      
      const hasOverview = overview.trim().length > 0;
      const hasMeals = mealGuidance.length > 0;
      const hasGuidelines = guidelines.length > 0;

      if (!hasOverview && !hasMeals && !hasGuidelines) {
        throw new Error("Plan must have some content (overview, meal guidance, or guidelines)");
      }

      if (overview.length > 2000) throw new Error("Overview is too long (max 2000 characters)");
      
      for (const mg of mealGuidance) {
        if (!mg.guidanceText.trim()) throw new Error("Meal guidance text cannot be empty");
        if (mg.guidanceText.length > 1000) throw new Error("Meal guidance is too long");
        if (mg.customLabel && mg.customLabel.length > 50) throw new Error("Meal label is too long");
      }

      for (const g of guidelines) {
        if (!g.text.trim()) throw new Error("Guideline text cannot be empty");
        if (g.text.length > 500) throw new Error("Guideline is too long");
      }

      const payload: DietPlanInput = {
        title: title.trim(),
        overview: overview.trim() || undefined,
        mealGuidance: mealGuidance.map(mg => ({
          mealType: mg.mealType,
          customLabel: mg.customLabel.trim() || undefined,
          guidanceText: mg.guidanceText.trim()
        })),
        guidelines: guidelines.map(g => ({ text: g.text.trim() }))
      };

      let result;
      if (initialData) {
        result = await updateDietPlan(initialData.id, payload);
      } else if (isStartingNewPlan) {
        // Need to import this dynamically if not imported, or just import it at top
        const { archiveAndStartNewDietPlan } = await import("./plan/actions");
        result = await archiveAndStartNewDietPlan(connectionId, payload);
      } else {
        result = await createDietPlan(connectionId, payload);
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
              placeholder="e.g. Fat Loss Phase 1" 
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overview">Overview / Philosophy</Label>
            <Textarea 
              id="overview" 
              value={overview} 
              onChange={(e) => setOverview(e.target.value)} 
              placeholder="General guidance, approach, or notes for the client..."
              maxLength={2000}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Meal Guidance</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddMeal}>
            <Plus className="w-4 h-4 mr-2" /> Add Meal
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {mealGuidance.length === 0 ? (
            <p className="text-sm text-[var(--color-neutral-500)] text-center py-4">No meal guidance added yet.</p>
          ) : (
            mealGuidance.map((meal, index) => (
              <div key={meal.id} className="p-4 border border-[var(--color-neutral-200)] rounded-lg bg-[var(--color-neutral-50)] space-y-4 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2 text-[var(--color-neutral-400)] hover:text-red-600"
                  onClick={() => handleRemoveMeal(meal.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="grid md:grid-cols-2 gap-4 mr-8">
                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-[var(--color-neutral-300)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      value={meal.mealType}
                      onChange={(e) => handleMealChange(meal.id, "mealType", e.target.value)}
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Label (Optional)</Label>
                    <Input 
                      value={meal.customLabel} 
                      onChange={(e) => handleMealChange(meal.id, "customLabel", e.target.value)} 
                      placeholder="e.g. Pre-workout Snack" 
                      maxLength={50}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Guidance</Label>
                  <Textarea 
                    value={meal.guidanceText} 
                    onChange={(e) => handleMealChange(meal.id, "guidanceText", e.target.value)} 
                    placeholder="Specific instructions for this meal..."
                    maxLength={1000}
                    required
                  />
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
                  placeholder="e.g. Drink 1 glass of water before each meal" 
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
