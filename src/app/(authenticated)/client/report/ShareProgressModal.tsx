"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PeriodSelector } from "@/components/ui/period-selector";
import { Share, Copy, CheckCircle2 } from "lucide-react";
import { ClientReportData } from "@/lib/data/client-report";

export function ShareProgressModal({ report }: { report: ClientReportData }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Period states default to what the report already has
  const [startDate, setStartDate] = useState(report.period.start);
  const [endDate, setEndDate] = useState(report.period.end);
  const [periodMode, setPeriodMode] = useState("month");

  const [text, setText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Generate the text synchronously
  const generateText = (start: string, end: string, mode: string) => {
    // 1. Header line
    let headerLine = "";
    if (mode === "7d") {
      headerLine = "*Last 7 Days Progress*";
    } else if (mode === "30d") {
      headerLine = "*Last 30 Days Progress*";
    } else if (mode === "custom") {
      headerLine = `*${new Date(start).toLocaleDateString()}–${new Date(end).toLocaleDateString()} Progress*`;
    } else if (mode === "month") {
      const sObj = new Date(start);
      const eObj = new Date(end);
      const monthName = sObj.toLocaleString('en-US', { month: 'long' });
      const year = sObj.getFullYear();
      
      const lastDayOfMonth = new Date(year, sObj.getMonth() + 1, 0);
      const isPartial = eObj < lastDayOfMonth;
      
      if (isPartial) {
        const partialDate = eObj.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        headerLine = `*${monthName} ${year} Progress (through ${partialDate})*`;
      } else {
        headerLine = `*${monthName} ${year} Progress*`;
      }
    }

    const lines: string[] = [headerLine];

    // Check if we have zero data
    const hasWeight = report.metrics.measurements !== null;
    const hasNutrition = report.metrics.nutrition !== null && report.metrics.nutrition.protein.current > 0;
    const hasWorkouts = report.metrics.workouts !== null && report.metrics.workouts.count.current > 0;
    const hasYoga = report.metrics.yoga !== null && report.metrics.yoga.count.current > 0;
    const hasFoodLogs = report.metrics.nutrition !== null; // Need to check daysLogged
    const hasHabits = report.metrics.habits !== null;

    if (!hasWeight && !hasNutrition && !hasWorkouts && !hasYoga && !hasFoodLogs && !hasHabits) {
      return ""; // Signals empty state
    }

    // 2. Weight or Goal
    const clientGoal = report.goalProgress.goal;
    const isWeightGoal = ["Weight Loss", "Weight Gain", "Weight Maintenance"].includes(clientGoal);
    
    if (isWeightGoal) {
      if (report.metrics.measurements) {
        const m = report.metrics.measurements;
        const current = m.currentWeight ?? 0;
        const change = m.weightChange ?? 0;
        const starting = current - change;
        
        lines.push(`Starting Weight: ${starting.toFixed(1)} kg`);
        lines.push(`Current Weight: ${current.toFixed(1)} kg`);
        const sign = change > 0 ? "+" : "";
        lines.push(`Change: ${sign}${change.toFixed(1)} kg`);
      }
    } else {
      lines.push(`Goal: ${clientGoal}`);
    }

    // 3. Nutrition (Protein & Water)
    if (report.metrics.nutrition) {
      if (report.metrics.nutrition.protein.current > 0) {
        lines.push(`Average Protein: ${report.metrics.nutrition.protein.current} g/day`);
      }
      if (report.metrics.nutrition.water.current > 0) {
        lines.push(`Average Water: ${report.metrics.nutrition.water.current} L/day`);
      }
    }

    // 4. Workouts
    if (report.metrics.workouts && report.metrics.workouts.count.current > 0) {
      lines.push(`Workouts Logged: ${report.metrics.workouts.count.current}`);
    }

    // 5. Yoga
    if (report.metrics.yoga && report.metrics.yoga.count.current > 0) {
      lines.push(`Yoga Sessions Logged: ${report.metrics.yoga.count.current}`);
    }

    // 6. Food Logging
    if (report.metrics.nutrition && report.metrics.nutrition.daysLogged !== undefined) {
      const daysLogged = report.metrics.nutrition.daysLogged;
      const totalDays = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      lines.push(`Food Logging: ${daysLogged}/${totalDays} days`);
    }

    // 7. Habit Score
    if (report.metrics.habits) {
      let totalCompleted = 0;
      let totalTarget = 0;
      report.metrics.habits.items.forEach(h => {
        totalCompleted += h.completed;
        totalTarget += h.target;
      });
      if (totalTarget > 0) {
        const score = Math.round((totalCompleted / totalTarget) * 100);
        lines.push(`Habit Score: ${score}%`);
      }
    }

    // 8. Sleep
    if (report.metrics.checkins && report.metrics.checkins.sleepHours.current !== null) {
      lines.push(`Average Sleep: ${report.metrics.checkins.sleepHours.current.toFixed(1)} hrs/night`);
    }

    // 9. Photos
    if (report.metrics.photos && report.metrics.photos.count > 0) {
      lines.push(`Progress Photos Logged: ${report.metrics.photos.count}`);
    }
    
    return lines.join("\n");
  }

  useEffect(() => {
    if (isOpen) {
      const newText = generateText(startDate, endDate, periodMode);
      setText(newText);
      setCopySuccess(false);
      setCopyError(false);
    }
  }, [isOpen, startDate, endDate, periodMode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setCopyError(false);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      setCopyError(true);
      setCopySuccess(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: text
        });
      } catch (err) {
        // user cancelled or share failed, ignore
      }
    } else {
      // Fallback
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setIsOpen(true)}>
        <Share className="w-4 h-4 mr-2" />
        Share Progress
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Share Progress"
      >
        <div className="space-y-4 pt-4">
          <PeriodSelector 
            useUrlParams={false}
            period={periodMode}
            onPeriodChange={(mode, start, end) => {
              setPeriodMode(mode);
              setStartDate(start);
              setEndDate(end);
            }}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />

          {text === "" ? (
            <div className="p-4 bg-[var(--color-neutral-50)] rounded-lg text-center border border-[var(--color-neutral-200)]">
              <p className="text-[var(--color-neutral-600)]">Nothing has been logged for this period yet. Log some data first, then come back to share your progress.</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-64 p-3 rounded-md border border-[var(--color-neutral-300)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                  maxLength={1000}
                />
                {copyError && (
                  <div className="absolute bottom-3 right-3 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm border border-red-100">
                    Failed to copy to clipboard. Select text to copy manually.
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleCopy} 
                  variant="outline" 
                  className="w-1/2"
                  disabled={text.trim() === ""}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Text
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleShare}
                  className="w-1/2"
                  disabled={text.trim() === ""}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
