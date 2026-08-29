"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { upsertDailyCheckIn } from "./actions";

export interface LogCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingData?: {
    date: string;
    sleepHours?: number | null;
    steps?: number | null;
    mood?: number | null;
    energy?: number | null;
    note?: string | null;
  } | null;
  defaultDate?: string;
  onSaved?: () => void;
}

export function LogCheckinModal({
  isOpen,
  onClose,
  existingData,
  defaultDate,
  onSaved
}: LogCheckinModalProps) {
  const [date, setDate] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [steps, setSteps] = useState("");
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [note, setNote] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingData) {
        setDate(existingData.date);
        setSleepHours(existingData.sleepHours != null ? existingData.sleepHours.toString() : "");
        setSteps(existingData.steps != null ? existingData.steps.toString() : "");
        setMood(existingData.mood != null ? existingData.mood.toString() : "");
        setEnergy(existingData.energy != null ? existingData.energy.toString() : "");
        setNote(existingData.note || "");
      } else {
        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const localTodayStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
        setDate(defaultDate || localTodayStr);
        setSleepHours("");
        setSteps("");
        setMood("");
        setEnergy("");
        setNote("");
      }
      setError(null);
    }
  }, [isOpen, existingData, defaultDate]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await upsertDailyCheckIn({
        date,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        steps: steps ? parseInt(steps, 10) : undefined,
        mood: mood ? parseInt(mood, 10) : undefined,
        energy: energy ? parseInt(energy, 10) : undefined,
        note: note || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to save check-in");
      } else {
        if (onSaved) onSaved();
        onClose();
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localTodayStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm sm:p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-[var(--color-neutral-200)]">
          <h2 className="text-lg font-bold text-[var(--color-neutral-800)]">
            {existingData ? "Edit Check-in" : "Log Check-in"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-neutral-500)] hover:text-black hover:bg-[var(--color-neutral-100)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                max={localTodayStr}
                onChange={(e) => {
                  setDate(e.target.value);
                  // Not auto-loading data for simplicity if date changed, but in a real app we might trigger a fetch here.
                  // The server will handle upsert correctly by date.
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sleepHours">Sleep (Hours)</Label>
                <Input
                  id="sleepHours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 7.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="steps">Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  min="0"
                  placeholder="e.g. 10000"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mood">Mood (1-5)</Label>
                <Select value={mood} onChange={(e) => setMood(e.target.value)} id="mood">
                  <option value="" disabled>Select mood</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Okay</option>
                  <option value="2">2 - Low</option>
                  <option value="1">1 - Very Low</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="energy">Energy (1-5)</Label>
                <Select value={energy} onChange={(e) => setEnergy(e.target.value)} id="energy">
                  <option value="" disabled>Select energy</option>
                  <option value="5">5 - High</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Okay</option>
                  <option value="2">2 - Low</option>
                  <option value="1">1 - Very Low</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="How did you feel today?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                className="h-24 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end px-6 py-4 bg-white border-t border-[var(--color-neutral-200)] gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Check-in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
