"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PeriodSelector } from "@/components/ui/period-selector";
import { Share, Copy, CheckCircle2 } from "lucide-react";
import { ClientReportData } from "@/lib/data/client-report";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function IndividualShareClient({ initialReport, initialStart, initialEnd, initialPeriodMode }: { 
  initialReport: ClientReportData,
  initialStart: string,
  initialEnd: string,
  initialPeriodMode: string 
}) {
  const router = useRouter()
  const [report, setReport] = useState<ClientReportData>(initialReport)
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [periodMode, setPeriodMode] = useState(initialPeriodMode);

  const [text, setText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  // Sync state when props change (due to URL navigation)
  useEffect(() => {
    setReport(initialReport);
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setPeriodMode(initialPeriodMode);
  }, [initialReport, initialStart, initialEnd, initialPeriodMode]);

  const generateText = (start: string, end: string, mode: string, reportData: ClientReportData) => {
    let headerLine = "";
    if (mode === "7d") {
      headerLine = "*Last 7 Days Progress*";
    } else if (mode === "30d") {
      headerLine = "*Last 30 Days Progress*";
    } else if (mode === "custom") {
      headerLine = `*${new Date(start).toLocaleDateString()}–${new Date(end).toLocaleDateString()} Progress*`;
    } else {
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

    const hasWeight = reportData.metrics.measurements !== null;
    const hasNutrition = reportData.metrics.nutrition !== null && reportData.metrics.nutrition.protein.current > 0;
    const hasWorkouts = reportData.metrics.workouts !== null && reportData.metrics.workouts.count.current > 0;
    const hasYoga = reportData.metrics.yoga !== null && reportData.metrics.yoga.count.current > 0;
    const hasFoodLogs = reportData.metrics.nutrition !== null; 
    const hasHabits = reportData.metrics.habits !== null;

    if (!hasWeight && !hasNutrition && !hasWorkouts && !hasYoga && !hasFoodLogs && !hasHabits) {
      return "";
    }

    const clientGoal = reportData.goalProgress.goal;
    const isWeightGoal = ["Weight Loss", "Weight Gain", "Weight Maintenance"].includes(clientGoal);
    
    if (isWeightGoal) {
      if (reportData.metrics.measurements) {
        const m = reportData.metrics.measurements;
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

    if (reportData.metrics.nutrition) {
      if (reportData.metrics.nutrition.protein.current > 0) {
        lines.push(`Avg Protein: ${reportData.metrics.nutrition.protein.current} g/day`);
      }
      if (reportData.metrics.nutrition.water.current > 0) {
        lines.push(`Avg Water: ${reportData.metrics.nutrition.water.current} L/day`);
      }
    }

    if (reportData.metrics.workouts && reportData.metrics.workouts.count.current > 0) {
      lines.push(`Workouts Logged: ${reportData.metrics.workouts.count.current}`);
    }

    if (reportData.metrics.yoga && reportData.metrics.yoga.count.current > 0) {
      lines.push(`Yoga Sessions Logged: ${reportData.metrics.yoga.count.current}`);
    }

    if (reportData.metrics.nutrition && reportData.metrics.nutrition.daysLogged !== undefined) {
      const daysLogged = reportData.metrics.nutrition.daysLogged;
      const totalDays = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      lines.push(`Food Logging: ${daysLogged}/${totalDays} days`);
    }

    if (reportData.metrics.habits) {
      let totalCompleted = 0;
      let totalTarget = 0;
      reportData.metrics.habits.items.forEach(h => {
        totalCompleted += h.completed;
        totalTarget += h.target;
      });
      if (totalTarget > 0) {
        const score = Math.round((totalCompleted / totalTarget) * 100);
        lines.push(`Habit Score: ${score}%`);
      }
    }

    if (reportData.metrics.checkins && reportData.metrics.checkins.sleepHours.current !== null) {
      lines.push(`Average Sleep: ${reportData.metrics.checkins.sleepHours.current.toFixed(1)} hrs/night`);
    }
    
    return lines.join("\n");
  }

  useEffect(() => {
    const newText = generateText(startDate, endDate, periodMode, report);
    setText(newText);
    setCopySuccess(false);
    setCopyError(false);
  }, [startDate, endDate, periodMode, report]);

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
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)] flex flex-col items-center justify-center">
        <PeriodSelector 
          useUrlParams={true}
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

        <div className="w-full mt-6">
          {text === "" ? (
            <div className="p-8 bg-[var(--color-neutral-50)] rounded-lg text-center border border-[var(--color-neutral-200)]">
              <p className="text-[var(--color-neutral-600)]">Nothing has been logged for this period yet. Log some data first, then come back to share your progress.</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="relative mb-6 shadow-sm border border-[var(--color-primary-200)] rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-primary-50)] to-white">
                <div className="bg-[var(--color-primary-600)] p-3 text-white text-center font-semibold text-sm flex items-center justify-center gap-2">
                  <Share className="w-4 h-4" /> Your Progress Summary
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-64 p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none bg-transparent"
                  maxLength={1000}
                />
                {copyError && (
                  <div className="absolute bottom-3 right-3 text-red-500 text-xs bg-white px-2 py-1 rounded shadow-sm border border-red-100">
                    Failed to copy to clipboard. Select text to copy manually.
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-center">
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
                  className="w-1/2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white"
                  disabled={text.trim() === ""}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
