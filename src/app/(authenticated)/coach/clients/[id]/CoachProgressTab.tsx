"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TrendChart } from "@/components/ui/trend-chart";
import { fetchCoachWeightHistory, fetchCoachMeasurementHistory } from "./actions";
import { WeightHistorySummary, MeasurementHistorySummary, MeasurementType } from "@/lib/progress/history";
import { PeriodSelector } from "@/components/ui/period-selector";
import { EmptyState } from "@/components/ui/states";
import { Activity } from "lucide-react";

export function CoachProgressTab({ clientId }: { clientId: string }) {
  const [activeTab, setActiveTab] = useState<"weight" | "measurements">("weight");
  
  // Shared state
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [period, setPeriod] = useState<"7" | "30" | "custom">("30");
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Weight state
  const [weightSummary, setWeightSummary] = useState<WeightHistorySummary | null>(null);
  
  // Measurement state
  const [metric, setMetric] = useState<MeasurementType>("waist");
  const [measurementSummary, setMeasurementSummary] = useState<MeasurementHistorySummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "weight") {
          const data = await fetchCoachWeightHistory(clientId, start, end);
          setWeightSummary(data as any);
        } else {
          const data = await fetchCoachMeasurementHistory(clientId, metric, start, end);
          setMeasurementSummary(data as any);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [clientId, activeTab, period, startDate, endDate, metric]);

  const renderWeightContent = () => {
    if (isLoading && !weightSummary) {
      return <div className="p-8 text-center text-sm text-[var(--color-neutral-500)]">Loading...</div>;
    }

    if (!weightSummary?.mostRecentWeight && !isLoading) {
      return (
        <EmptyState 
          icon={<Activity className="w-12 h-12 text-[var(--color-neutral-400)]" />}
          title="No Weight Data"
          description="Client hasn't logged any weight data yet."
        />
      );
    }

    const chartData = weightSummary?.entries.map(e => ({
      date: e.date,
      value: e.value,
      isLogged: e.isLogged
    })) || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-neutral-900)]">
              Current Weight: {weightSummary?.mostRecentWeight} {weightSummary?.preferredWeightUnit}
            </h2>
            {weightSummary?.hasWeightGoal && weightSummary?.targetWeight && (
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                vs. target {weightSummary.targetWeight} {weightSummary.preferredWeightUnit}
              </p>
            )}
          </div>
        </div>

        <div className="bg-[var(--background)] p-4 sm:p-6 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
          <TrendChart 
            data={chartData} 
            referenceLine={weightSummary?.hasWeightGoal ? weightSummary?.targetWeight : undefined}
            metricColor="var(--color-primary-500)"
          />
          
          <div className="flex gap-6 mt-6 pt-6 border-t border-[var(--color-neutral-100)]">
            <div>
              <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Average</p>
              <p className="text-lg font-bold text-[var(--color-neutral-900)] mt-1">
                {weightSummary?.periodAverage != null ? `${weightSummary.periodAverage.toFixed(1)} ${weightSummary?.preferredWeightUnit}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Change</p>
              <p className="text-lg font-bold text-[var(--color-neutral-900)] mt-1">
                {weightSummary?.periodChange != null ? `${weightSummary.periodChange > 0 ? '+' : ''}${weightSummary.periodChange.toFixed(1)} ${weightSummary?.preferredWeightUnit}` : "-"}
              </p>
            </div>
          </div>
        </div>

        {weightSummary?.entries && weightSummary.entries.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--color-neutral-800)]">Logs in Period</h3>
            <div className="grid grid-cols-1 gap-3">
              {[...weightSummary.entries].reverse().map((entry) => (
                <div key={entry.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-[var(--color-neutral-50)] p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--color-neutral-900)]">{entry.value} {weightSummary?.preferredWeightUnit}</span>
                      <span className="text-sm text-[var(--color-neutral-500)]">• {new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-[var(--color-neutral-600)] mt-1">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMeasurementContent = () => {
    if (isLoading && !measurementSummary) {
      return <div className="p-8 text-center text-sm text-[var(--color-neutral-500)]">Loading...</div>;
    }

    if (!measurementSummary?.mostRecentValue && !isLoading) {
      return (
        <div className="space-y-6">
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
          <EmptyState 
            icon={<Activity className="w-12 h-12 text-[var(--color-neutral-400)]" />}
            title={`No ${metric} Data`}
            description={`Client hasn't logged any ${metric} measurements yet.`}
          />
        </div>
      );
    }

    const chartData = measurementSummary?.entries.map(e => ({
      date: e.date,
      value: e.value,
      isLogged: e.isLogged
    })) || [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        </div>

        <div className="bg-[var(--background)] p-4 sm:p-6 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
          <TrendChart 
            data={chartData} 
            metricColor="var(--color-secondary-500)"
          />
          
          <div className="flex gap-6 mt-6 pt-6 border-t border-[var(--color-neutral-100)]">
            <div>
              <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Average</p>
              <p className="text-lg font-bold text-[var(--color-neutral-900)] mt-1">
                {measurementSummary?.periodAverage != null ? `${measurementSummary.periodAverage.toFixed(1)} ${measurementSummary?.preferredMeasurementUnit}` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Change</p>
              <p className="text-lg font-bold text-[var(--color-neutral-900)] mt-1">
                {measurementSummary?.periodChange != null ? `${measurementSummary.periodChange > 0 ? '+' : ''}${measurementSummary.periodChange.toFixed(1)} ${measurementSummary?.preferredMeasurementUnit}` : "-"}
              </p>
            </div>
          </div>
        </div>

        {measurementSummary?.entries && measurementSummary.entries.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--color-neutral-800)]">Logs in Period</h3>
            <div className="grid grid-cols-1 gap-3">
              {[...measurementSummary.entries].reverse().map((entry) => (
                <div key={entry.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-[var(--color-neutral-50)] p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--color-neutral-900)]">{entry.value} {measurementSummary?.preferredMeasurementUnit}</span>
                      <span className="text-sm text-[var(--color-neutral-500)]">• {new Date(entry.date).toLocaleDateString()}</span>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-[var(--color-neutral-600)] mt-1">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Area */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-[var(--background)] p-4 rounded-xl border border-[var(--color-neutral-200)] shadow-sm">
        <PeriodSelector 
          period={period}
          onPeriodChange={(p, s, e) => {
            setPeriod(p as any)
            setStartDate(s)
            setEndDate(e)
          }}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="mb-6 bg-[var(--background)] border border-[var(--color-neutral-200)] shadow-sm">
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="measurements">Body Measurements</TabsTrigger>
        </TabsList>
        <TabsContent value="weight">
          {renderWeightContent()}
        </TabsContent>
        <TabsContent value="measurements">
          {renderMeasurementContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
