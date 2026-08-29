"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logWeight, editWeight } from "./actions";

type LogWeightDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferredWeightUnit: string;
  initialData?: {
    id: string;
    date: string;
    value: number;
    note: string | null;
  } | null;
};

export function LogWeightDialog({ open, onOpenChange, preferredWeightUnit, initialData }: LogWeightDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [weightValue, setWeightValue] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setDate(initialData.date);
        setWeightValue(initialData.value.toString());
        setNote(initialData.note || "");
      } else {
        setDate(todayStr);
        setWeightValue("");
        setNote("");
      }
      setError(null);
    }
  }, [open, initialData, todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const val = parseFloat(weightValue);
      if (isNaN(val) || val <= 0) {
        throw new Error("Please enter a valid weight.");
      }

      const payload = {
        date,
        weightValue: val,
        note: note.trim() || undefined
      };

      let result;
      if (initialData) {
        result = await editWeight(initialData.id, payload);
      } else {
        result = await logWeight(payload);
      }

      if (result.success) {
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to save weight.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={initialData ? "Edit Weight" : "Log Weight"}
      description={`Record your weight in ${preferredWeightUnit}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date"
            type="date" 
            value={date}
            max={todayStr}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weightValue">Weight ({preferredWeightUnit})</Label>
          <Input 
            id="weightValue"
            type="number"
            step="0.1"
            min="1"
            max="1000"
            value={weightValue}
            onChange={(e) => setWeightValue(e.target.value)}
            required
            placeholder="e.g., 75.5"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea 
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How are you feeling?"
            rows={3}
            disabled={isSubmitting}
            maxLength={500}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-neutral-200)] mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !weightValue || !date}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
