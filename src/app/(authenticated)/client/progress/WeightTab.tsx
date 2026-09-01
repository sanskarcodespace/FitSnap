"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { PeriodSelector } from "@/components/ui/period-selector";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendChart } from "@/components/ui/trend-chart";
import { LogWeightDialog } from "./LogWeightDialog";
import { fetchWeightHistory, deleteWeight } from "./actions";
import { WeightHistorySummary } from "@/lib/progress/history";

export function WeightTab() {
  const [summary, setSummary] = useState<WeightHistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "30" | "custom">("30");
  
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let start = startDate;
      let end = endDate;
      if (period === "7") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().split('T')[0];
        end = todayStr;
      } else if (period === "30") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        start = d.toISOString().split('T')[0];
        end = todayStr;
      }
      
      const data = await fetchWeightHistory(start, end);
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, startDate, endDate]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this log?")) {
      await deleteWeight(id);
      loadData();
    }
  };

  if (isLoading && !summary) {
    return <div className="p-8 text-center text-sm text-[var(--color-neutral-500)]">Loading...</div>;
  }

  // If literally no entries exist anywhere (mostRecentWeight is null), show empty state
  if (!summary?.mostRecentWeight && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <p className="text-[var(--color-neutral-500)]">No weight logged yet.</p>
        <Button onClick={() => setIsLogDialogOpen(true)}>Log Weight</Button>
        <LogWeightDialog 
          open={isLogDialogOpen}
          onOpenChange={(open) => {
            setIsLogDialogOpen(open);
            if (!open) loadData();
          }}
          preferredWeightUnit={summary?.preferredWeightUnit || "kg"}
        />
      </div>
    );
  }

  const chartData = summary?.entries.map(e => ({
    date: e.date,
    value: e.value,
    isLogged: e.isLogged
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Headline */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[var(--text-h3-size)] font-bold text-[var(--color-neutral-900)]">
            Current Weight: {summary?.mostRecentWeight} {summary?.preferredWeightUnit}
          </h2>
          {summary?.hasWeightGoal && summary?.targetWeight && (
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              vs. target {summary.targetWeight} {summary.preferredWeightUnit}
            </p>
          )}
        </div>
        <Button onClick={() => setIsLogDialogOpen(true)}>Log Weight</Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
        <PeriodSelector 
          period={period}
          onPeriodChange={(p, s, e) => {
            setPeriod(p as any)
            setStartDate(s)
            setEndDate(e)
            loadData()
          }}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* History List */}
      {summary?.entries && summary.entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--color-neutral-800)]">Logs in Period</h3>
          <div className="grid grid-cols-1 gap-3">
            {[...summary.entries].reverse().map((entry) => (
              <div key={entry.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-neutral-900)]">{entry.value} {summary?.preferredWeightUnit}</span>
                    <span className="text-sm text-[var(--color-neutral-500)]">• {new Date(entry.date).toLocaleDateString()}</span>
                  </div>
                  {entry.note && (
                    <p className="text-sm text-[var(--color-neutral-600)] mt-1">{entry.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingEntry(entry);
                      setIsLogDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <LogWeightDialog 
        open={isLogDialogOpen}
        onOpenChange={(open) => {
          setIsLogDialogOpen(open);
          if (!open) {
            setEditingEntry(null);
            loadData();
          }
        }}
        preferredWeightUnit={summary?.preferredWeightUnit || "kg"}
        initialData={editingEntry}
      />
    </div>
  );
}
