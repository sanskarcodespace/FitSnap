"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogCheckinModal } from "./checkins/LogCheckinModal";

interface DailyCheckIn {
  id: string;
  date: string;
  sleepHours: number | null;
  steps: number | null;
  mood: number | null;
  energy: number | null;
  note: string | null;
}

interface DashboardCheckinCardProps {
  todayCheckIn: DailyCheckIn | null;
  basePath?: string;
}

export function DashboardCheckinCard({ todayCheckIn, basePath = "/client" }: DashboardCheckinCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Derive a quick summary string
  let summary = "";
  if (todayCheckIn) {
    const parts = [];
    if (todayCheckIn.mood) parts.push(`Mood: ${todayCheckIn.mood}/5`);
    if (todayCheckIn.energy) parts.push(`Energy: ${todayCheckIn.energy}/5`);
    if (todayCheckIn.sleepHours) parts.push(`Sleep: ${todayCheckIn.sleepHours}h`);
    if (todayCheckIn.steps) parts.push(`Steps: ${todayCheckIn.steps.toLocaleString()}`);
    summary = parts.join(" • ");
  }

  return (
    <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[var(--color-primary-600)]" />
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">
            Daily Check-in
          </h2>
        </div>
        <Link 
          href={`${basePath}/checkins`} 
          className="text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] flex items-center gap-1"
        >
          View History <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)] flex-1 flex flex-col justify-center items-center text-center">
        {todayCheckIn ? (
          <>
            <p className="font-bold text-[var(--color-neutral-900)] mb-1">Checked in for today</p>
            <p className="text-sm text-[var(--color-neutral-600)] mb-4">{summary}</p>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
              Edit Today's Check-in
            </Button>
          </>
        ) : (
          <>
            <p className="text-[var(--color-neutral-600)] mb-4">No check-in yet today.</p>
            <Button onClick={() => setModalOpen(true)}>Log Check-in</Button>
          </>
        )}
      </div>

      <LogCheckinModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        existingData={todayCheckIn}
      />
    </section>
  );
}
