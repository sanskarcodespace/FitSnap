"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendChart } from "@/components/ui/trend-chart";
import { LogMeasurementDialog } from "./LogMeasurementDialog";
import { fetchMeasurementHistory, deleteMeasurement, updatePreferredMeasurementUnit } from "./actions";
import { MeasurementType, MeasurementHistorySummary } from "@/lib/progress/history";

export function BodyMeasurementsTab() {
  const [summary, setSummary] = useState<MeasurementHistorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [metric, setMetric] = useState<MeasurementType>("waist");
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
      
      const data = await fetchMeasurementHistory(metric, start, end);
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [metric, period, startDate, endDate]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this log?")) {
      await deleteMeasurement(id);
      loadData();
    }
  };

  const handleUnitToggle = async (newUnit: "cm" | "in") => {
    if (summary && newUnit !== summary.preferredMeasurementUnit) {
      // Optimistic update
      setSummary({ ...summary, preferredMeasurementUnit: newUnit });
      await updatePreferredMeasurementUnit(newUnit);
      loadData();
    }
  };

  if (isLoading && !summary) {
    return <div className="p-8 text-center text-sm text-[var(--color-neutral-500)]">Loading...</div>;
  }

  const chartData = summary?.entries.map(e => ({
    date: e.date,
    value: e.value,
    isLogged: e.isLogged
  })) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Top Controls: Metric Selector, Unit Toggle, and Log Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Select 
            value={metric} 
            onChange={(e) => setMetric(e.target.value as MeasurementType)}
            className="w-40 font-bold"
          >
            <option value="waist">Waist</option>
            <option value="chest">Chest</option>
            <option value="hips">Hips</option>
            <option value="arms">Arms</option>
            <option value="thighs">Thighs</option>
          </Select>
          
          <div className="flex bg-[var(--color-neutral-100)] p-1 rounded-lg">
            <button
              onClick={() => handleUnitToggle("cm")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                summary?.preferredMeasurementUnit === "cm" 
                  ? "bg-white text-[var(--color-neutral-900)] shadow-sm" 
                  : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"
              }`}
            >
              cm
            </button>
            <button
              onClick={() => handleUnitToggle("in")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                summary?.preferredMeasurementUnit === "in" 
                  ? "bg-white text-[var(--color-neutral-900)] shadow-sm" 
                  : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"
              }`}
            >
              in
            </button>
          </div>
        </div>
        <Button onClick={() => setIsLogDialogOpen(true)}>Log Measurements</Button>
      </div>

      {/* Period Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
        <div className="w-full md:w-auto">
          <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Time Period</label>
          <Select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as any)}
            className="w-full md:w-40"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </Select>
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div>
              <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Start</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">End</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                max={todayStr}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!summary?.mostRecentValue && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <p className="text-[var(--color-neutral-500)]">No {metric} measurements logged yet.</p>
          <Button variant="outline" onClick={() => setIsLogDialogOpen(true)}>Log Measurement</Button>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
          <TrendChart 
            data={chartData} 
            metricColor="var(--color-secondary-500)"
          />
          
          {/* Stats Row */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-[var(--color-neutral-100)]">
            <div>
              <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Average</p>
              <p className="text-lg font-bold text-[var(--color-neutral-900)] mt-1">
                {summary?.periodAverage != null ? `${summary.periodAverage.toFixed(1)} ${summary?.preferredMeasurementUnit}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Change</p>
              <p className="text-lg font-bold text-[var(--color-neutral-900)] mt-1">
                {summary?.periodChange != null ? `${summary.periodChange > 0 ? '+' : ''}${summary.periodChange.toFixed(1)} ${summary?.preferredMeasurementUnit}` : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      {summary?.entries && summary.entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--color-neutral-800)]">Logs in Period</h3>
          <div className="grid grid-cols-1 gap-3">
            {[...summary.entries].reverse().map((entry) => (
              <div key={entry.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--color-neutral-900)]">{entry.value} {summary?.preferredMeasurementUnit}</span>
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
                      setEditingEntry({
                        id: entry.id,
                        date: entry.date,
                        [`${metric}Value`]: entry.value,
                        note: entry.note
                      });
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

      <LogMeasurementDialog 
        open={isLogDialogOpen}
        onOpenChange={(open) => {
          setIsLogDialogOpen(open);
          if (!open) {
            setEditingEntry(null);
            loadData();
          }
        }}
        preferredMeasurementUnit={summary?.preferredMeasurementUnit || "cm"}
        initialData={editingEntry}
      />
    </div>
  );
}
