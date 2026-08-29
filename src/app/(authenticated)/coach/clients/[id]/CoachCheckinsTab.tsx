"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCheckinStats } from "@/app/(authenticated)/client/checkins/actions";
import { TrendChart } from "@/components/ui/trend-chart";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar, ClipboardList } from "lucide-react";

export function generateDateRange(start: string, end: string): string[] {
  const dates = [];
  let current = new Date(start);
  const endDate = new Date(end);
  
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

interface CoachCheckinsTabProps {
  clientId: string;
}

type Metric = "sleep" | "steps" | "mood" | "energy";

export function CoachCheckinsTab({ clientId }: CoachCheckinsTabProps) {
  const [metric, setMetric] = useState<Metric>("sleep");
  const [period, setPeriod] = useState("7");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const todayDateObj = new Date();
    const tzOffset = todayDateObj.getTimezoneOffset() * 60000;
    const todayStr = new Date(todayDateObj.getTime() - tzOffset).toISOString().split('T')[0];

    let rangeStart = "";
    let rangeEnd = todayStr;

    if (period === "7") {
      const d = new Date(todayDateObj.getTime() - tzOffset);
      d.setDate(d.getDate() - 6);
      rangeStart = d.toISOString().split("T")[0];
    } else if (period === "30") {
      const d = new Date(todayDateObj.getTime() - tzOffset);
      d.setDate(d.getDate() - 29);
      rangeStart = d.toISOString().split("T")[0];
    } else {
      rangeStart = customStart || todayStr;
      rangeEnd = customEnd || todayStr;
    }

    try {
      const result = await getCheckinStats(clientId, rangeStart, rangeEnd);
      
      // Compute default metric if we just loaded for the first time and have history
      if (!stats && result.history.length > 0) {
        const mostRecent = result.history[0];
        if (mostRecent.sleepHours != null) setMetric("sleep");
        else if (mostRecent.steps != null) setMetric("steps");
        else if (mostRecent.mood != null) setMetric("mood");
        else if (mostRecent.energy != null) setMetric("energy");
      }
      
      // Prepare TrendChart data
      const dates = generateDateRange(rangeStart, rangeEnd);
      const chartData = dates.map(d => {
        const entry = result.periodCheckIns.find((c: any) => c.date === d);
        let val = 0;
        let isLogged = false;
        
        if (entry) {
          if (metric === "sleep" && entry.sleepHours != null) { val = entry.sleepHours; isLogged = true; }
          else if (metric === "steps" && entry.steps != null) { val = entry.steps; isLogged = true; }
          else if (metric === "mood" && entry.mood != null) { val = entry.mood; isLogged = true; }
          else if (metric === "energy" && entry.energy != null) { val = entry.energy; isLogged = true; }
        }
        
        return { date: d, value: val, isLogged };
      });

      setStats({ ...result, chartData });
    } catch (err: any) {
      setError(err.message || "Failed to load check-ins");
    } finally {
      setLoading(false);
    }
  }, [clientId, period, customStart, customEnd, metric]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Determine fixed axis
  const fixedYAxisRange = (metric === "mood" || metric === "energy") ? [1, 5] as [number, number] : undefined;

  const getMetricLabel = (m: Metric) => {
    switch (m) {
      case "sleep": return "Sleep (hrs)";
      case "steps": return "Steps";
      case "mood": return "Mood (1-5)";
      case "energy": return "Energy (1-5)";
    }
  }

  const getMetricColor = (m: Metric) => {
    switch (m) {
      case "sleep": return "var(--color-primary-500)";
      case "steps": return "#10b981"; // emerald
      case "mood": return "#f59e0b"; // amber
      case "energy": return "#ef4444"; // red
    }
  }

  const formatAvg = (val: number | null, isInt = false) => {
    if (val == null) return "-";
    return isInt ? Math.round(val).toLocaleString() : val.toFixed(1);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!loading && stats?.history.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-[var(--color-neutral-200)] text-center flex flex-col items-center justify-center">
          <ClipboardList className="w-12 h-12 text-[var(--color-neutral-300)] mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-neutral-800)] mb-2">No check-ins logged yet</h2>
          <p className="text-[var(--color-neutral-500)] mb-6 max-w-sm">
            This client has not logged any check-ins.
          </p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-4">
                {/* Metric Selector */}
                <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                  {(["sleep", "steps", "mood", "energy"] as Metric[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetric(m)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                        metric === m
                          ? "bg-[var(--color-neutral-900)] text-white border-[var(--color-neutral-900)]"
                          : "bg-white text-[var(--color-neutral-600)] border-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-50)]"
                      }`}
                    >
                      {getMetricLabel(m)}
                    </button>
                  ))}
                </div>

                {/* Period Selector */}
                <div className="flex flex-wrap items-center gap-2 bg-[var(--color-neutral-50)] p-1 rounded-lg border border-[var(--color-neutral-200)] self-start">
                  <button
                    onClick={() => setPeriod("7")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      period === "7" ? "bg-white text-black shadow-sm" : "text-[var(--color-neutral-500)] hover:text-black"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setPeriod("30")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      period === "30" ? "bg-white text-black shadow-sm" : "text-[var(--color-neutral-500)] hover:text-black"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setPeriod("custom")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      period === "custom" ? "bg-white text-black shadow-sm" : "text-[var(--color-neutral-500)] hover:text-black"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {period === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      className="text-sm border border-[var(--color-neutral-300)] rounded px-2 py-1"
                    />
                    <span className="text-[var(--color-neutral-500)]">to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      className="text-sm border border-[var(--color-neutral-300)] rounded px-2 py-1"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <TrendChart
                    data={stats?.chartData || []}
                    metricColor={getMetricColor(metric)}
                    fixedYAxisRange={fixedYAxisRange}
                    yAxisLabel={getMetricLabel(metric)}
                  />
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--color-neutral-100)]">
                    <div className="text-center">
                      <p className="text-xs text-[var(--color-neutral-500)] font-medium mb-1 uppercase tracking-wider">Average</p>
                      <p className="text-xl font-bold text-[var(--color-neutral-900)]">
                        {metric === "sleep" ? formatAvg(stats?.averages?.sleepHours) :
                         metric === "steps" ? formatAvg(stats?.averages?.steps, true) :
                         metric === "mood" ? formatAvg(stats?.averages?.mood) :
                         formatAvg(stats?.averages?.energy)}
                      </p>
                    </div>
                    <div className="text-center border-l border-[var(--color-neutral-100)]">
                      <p className="text-xs text-[var(--color-neutral-500)] font-medium mb-1 uppercase tracking-wider">Days Logged</p>
                      <p className="text-xl font-bold text-[var(--color-neutral-900)]">
                        {stats?.totalDays || 0}
                      </p>
                    </div>
                    <div className="text-center border-l border-[var(--color-neutral-100)]">
                      <p className="text-xs text-[var(--color-neutral-500)] font-medium mb-1 uppercase tracking-wider">Streak</p>
                      <p className="text-xl font-bold text-[var(--color-neutral-900)]">
                        {stats?.currentStreak || 0}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* History List */}
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-[var(--color-neutral-800)]">History</h2>
            {stats?.history.length === 0 && !loading && (
              <p className="text-[var(--color-neutral-500)] text-sm">No check-ins found.</p>
            )}
            
            {stats?.history.map((entry: any) => {
              const d = new Date(entry.date);
              const formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
              
              const parts = [];
              if (entry.mood) parts.push(`Mood: ${entry.mood}/5`);
              if (entry.energy) parts.push(`Energy: ${entry.energy}/5`);
              if (entry.sleepHours) parts.push(`Sleep: ${entry.sleepHours}h`);
              if (entry.steps) parts.push(`Steps: ${entry.steps.toLocaleString()}`);

              return (
                <div key={entry.id} className="bg-white rounded-lg border border-[var(--color-neutral-200)] p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--color-neutral-500)]" />
                      <span className="font-bold text-[var(--color-neutral-800)]">{formattedDate}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-[var(--color-neutral-700)] mb-1 flex flex-wrap gap-x-3 gap-y-1">
                    {parts.map((p, i) => (
                      <span key={i} className="bg-[var(--color-neutral-100)] px-2 py-0.5 rounded text-xs">{p}</span>
                    ))}
                  </div>
                  {entry.note && (
                    <p className="text-sm text-[var(--color-neutral-600)] mt-2 italic break-words whitespace-pre-wrap">
                      "{entry.note}"
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  );
}
