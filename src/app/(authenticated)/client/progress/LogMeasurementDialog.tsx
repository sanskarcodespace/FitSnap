"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logMeasurement, editMeasurement } from "./actions";

type LogMeasurementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferredMeasurementUnit: string;
  initialData?: {
    id: string;
    date: string;
    waistValue?: number;
    chestValue?: number;
    hipsValue?: number;
    armsValue?: number;
    thighsValue?: number;
    note: string | null;
  } | null;
};

export function LogMeasurementDialog({ open, onOpenChange, preferredMeasurementUnit, initialData }: LogMeasurementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [waistValue, setWaistValue] = useState("");
  const [chestValue, setChestValue] = useState("");
  const [hipsValue, setHipsValue] = useState("");
  const [armsValue, setArmsValue] = useState("");
  const [thighsValue, setThighsValue] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        setDate(initialData.date);
        setWaistValue(initialData.waistValue ? initialData.waistValue.toString() : "");
        setChestValue(initialData.chestValue ? initialData.chestValue.toString() : "");
        setHipsValue(initialData.hipsValue ? initialData.hipsValue.toString() : "");
        setArmsValue(initialData.armsValue ? initialData.armsValue.toString() : "");
        setThighsValue(initialData.thighsValue ? initialData.thighsValue.toString() : "");
        setNote(initialData.note || "");
      } else {
        setDate(todayStr);
        setWaistValue("");
        setChestValue("");
        setHipsValue("");
        setArmsValue("");
        setThighsValue("");
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
      const getNum = (str: string) => {
        const val = parseFloat(str);
        return isNaN(val) ? undefined : val;
      };

      const payload = {
        date,
        waistValue: getNum(waistValue),
        chestValue: getNum(chestValue),
        hipsValue: getNum(hipsValue),
        armsValue: getNum(armsValue),
        thighsValue: getNum(thighsValue),
        note: note.trim() || undefined
      };

      if (!payload.waistValue && !payload.chestValue && !payload.hipsValue && !payload.armsValue && !payload.thighsValue) {
        throw new Error("Please provide at least one measurement.");
      }

      let result;
      if (initialData) {
        result = await editMeasurement(initialData.id, payload);
      } else {
        result = await logMeasurement(payload);
      }

      if (result.success) {
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to save measurements.");
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
      title={initialData ? "Edit Measurements" : "Log Measurements"}
      description={`Record your body measurements in ${preferredMeasurementUnit}.`}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="waistValue">Waist ({preferredMeasurementUnit})</Label>
            <Input 
              id="waistValue"
              type="number"
              step="0.1"
              min="1"
              max="1000"
              value={waistValue}
              onChange={(e) => setWaistValue(e.target.value)}
              placeholder="e.g., 85"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chestValue">Chest ({preferredMeasurementUnit})</Label>
            <Input 
              id="chestValue"
              type="number"
              step="0.1"
              min="1"
              max="1000"
              value={chestValue}
              onChange={(e) => setChestValue(e.target.value)}
              placeholder="e.g., 100"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hipsValue">Hips ({preferredMeasurementUnit})</Label>
            <Input 
              id="hipsValue"
              type="number"
              step="0.1"
              min="1"
              max="1000"
              value={hipsValue}
              onChange={(e) => setHipsValue(e.target.value)}
              placeholder="e.g., 95"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="armsValue">Arms ({preferredMeasurementUnit})</Label>
            <Input 
              id="armsValue"
              type="number"
              step="0.1"
              min="1"
              max="1000"
              value={armsValue}
              onChange={(e) => setArmsValue(e.target.value)}
              placeholder="e.g., 35"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thighsValue">Thighs ({preferredMeasurementUnit})</Label>
            <Input 
              id="thighsValue"
              type="number"
              step="0.1"
              min="1"
              max="1000"
              value={thighsValue}
              onChange={(e) => setThighsValue(e.target.value)}
              placeholder="e.g., 60"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea 
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any comments?"
            rows={2}
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
            disabled={isSubmitting || !date}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
