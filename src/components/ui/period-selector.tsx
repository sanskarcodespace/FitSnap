"use client"

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select"; // wait, the previous code used a native select. Let's use a native select to match `ReportPeriodSelector` or whatever the others used.

export type PeriodSelectorProps = {
  // Controlled mode props
  period?: string;
  onPeriodChange?: (period: string, startDate: string, endDate: string) => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  onApplyCustom?: () => void;
  
  // URL mode props
  useUrlParams?: boolean;
  
  // Common
  clientOnboardingDate?: Date | null;
  defaultPeriod?: string;
};

export function PeriodSelector({
  period: controlledPeriod,
  onPeriodChange,
  startDate: controlledStartDate,
  onStartDateChange,
  endDate: controlledEndDate,
  onEndDateChange,
  onApplyCustom,
  useUrlParams = false,
  clientOnboardingDate,
  defaultPeriod = "30"
}: PeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlPeriod = searchParams.get("period") || defaultPeriod;
  const urlStart = searchParams.get("start") || "";
  const urlEnd = searchParams.get("end") || "";

  const isControlled = !useUrlParams;
  
  const [internalPeriod, setInternalPeriod] = useState(useUrlParams ? urlPeriod : (controlledPeriod || defaultPeriod));
  const [internalStart, setInternalStart] = useState(useUrlParams ? urlStart : (controlledStartDate || ""));
  const [internalEnd, setInternalEnd] = useState(useUrlParams ? urlEnd : (controlledEndDate || ""));
  const [monthStr, setMonthStr] = useState<string>(""); // YYYY-MM
  const [error, setError] = useState("");

  const currentPeriod = isControlled ? controlledPeriod : internalPeriod;
  const currentStart = isControlled ? controlledStartDate : internalStart;
  const currentEnd = isControlled ? controlledEndDate : internalEnd;

  useEffect(() => {
    if (useUrlParams) {
      if (searchParams.get("period") === "month" && searchParams.get("month")) {
        setMonthStr(searchParams.get("month")!);
      }
    }
  }, [searchParams, useUrlParams]);

  // When mounting, if it's Month mode by default (e.g. client report defaults to current month)
  useEffect(() => {
    if (!useUrlParams && currentPeriod === "month" && !monthStr) {
      const today = new Date();
      const mStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setMonthStr(mStr);
      // Wait, we need to trigger an update for the dates
    }
  }, []);

  const updateUrl = (p: string, s: string, e: string, extra?: { month?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    params.set("start", s);
    params.set("end", e);
    if (extra?.month) {
      params.set("month", extra.month);
    } else {
      params.delete("month");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const notifyChange = (p: string, s: string, e: string) => {
    if (useUrlParams) {
      // url updates happen explicitly, but we might want to update local state too
      setInternalPeriod(p);
      setInternalStart(s);
      setInternalEnd(e);
    } else {
      onPeriodChange?.(p, s, e);
    }
  };

  const handlePeriodChange = (val: string) => {
    if (!useUrlParams) {
      if (onPeriodChange) onPeriodChange(val, currentStart || "", currentEnd || "");
      // The parent is expected to call handleApply?
      // Actually, if val is 7 or 30, we should compute and notify immediately
    } else {
      setInternalPeriod(val);
    }
    setError("");

    const today = new Date();
    const endStr = today.toISOString().split("T")[0];
    
    if (val === "7" || val === "7d") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      const startStr = start.toISOString().split("T")[0];
      
      if (useUrlParams) {
        updateUrl(val, startStr, endStr);
      } else {
        onPeriodChange?.(val, startStr, endStr);
      }
    } else if (val === "30" || val === "30d") {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      const startStr = start.toISOString().split("T")[0];
      
      if (useUrlParams) {
        updateUrl(val, startStr, endStr);
      } else {
        onPeriodChange?.(val, startStr, endStr);
      }
    } else if (val === "month") {
      // Default to current month
      const mStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setMonthStr(mStr);
      
      const startStr = `${mStr}-01`;
      
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const endStr = `${mStr}-${String(lastDay).padStart(2, '0')}`;
      
      applyMonth(mStr, val);
    }
  };

  const applyMonth = (mStr: string, pMode: string) => {
    const today = new Date();
    const [y, m] = mStr.split("-").map(Number);
    const startStr = `${mStr}-01`;
    let endStr = "";

    if (y === today.getFullYear() && m === today.getMonth() + 1) {
      // Current month -> up to today
      endStr = today.toISOString().split("T")[0];
    } else {
      // Past month -> up to last day
      const lastDay = new Date(y, m, 0); // 0th day of next month = last day of this month
      endStr = lastDay.toISOString().split("T")[0];
    }

    if (useUrlParams) {
      updateUrl(pMode, startStr, endStr, { month: mStr });
    } else {
      onPeriodChange?.(pMode, startStr, endStr);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    setMonthStr(newMonth);
    applyMonth(newMonth, currentPeriod!);
  };

  const handleCustomSearch = () => {
    const s = useUrlParams ? internalStart : currentStart;
    const e = useUrlParams ? internalEnd : currentEnd;

    if (!s || !e) {
      setError("Please select both start and end dates");
      return;
    }
    if (s > e) {
      setError("Start date cannot be after end date");
      return;
    }
    const startObj = new Date(s);
    const endObj = new Date(e);
    const days = Math.floor((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 366) {
      setError("Date range cannot exceed 366 days");
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (e > today) {
      setError("End date cannot be in the future");
      return;
    }

    setError("");
    if (useUrlParams) {
      updateUrl(currentPeriod!, s, e);
    } else {
      onApplyCustom?.();
    }
  };

  // Min month restriction based on onboarding
  let minMonth = undefined;
  if (clientOnboardingDate) {
    minMonth = `${clientOnboardingDate.getFullYear()}-${String(clientOnboardingDate.getMonth() + 1).padStart(2, '0')}`;
  }
  const maxMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Standardize currentPeriod formatting (7 vs 7d)
  const displayPeriod = currentPeriod?.replace("d", "") || "30";

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end w-full print:hidden">
      <div className="w-full md:w-auto">
        <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Time Period</label>
        <select 
          className="px-3 py-2 min-h-[44px] border border-[var(--color-neutral-300)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] w-full md:w-40"
          value={currentPeriod}
          onChange={(e) => handlePeriodChange(e.target.value)}
        >
          {/* We support both 7/7d depending on the caller */}
          <option value={currentPeriod?.includes("d") ? "7d" : "7"}>Last 7 Days</option>
          <option value={currentPeriod?.includes("d") ? "30d" : "30"}>Last 30 Days</option>
          <option value="month">By Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
        
      {currentPeriod === "month" && (
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1">
            <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Select Month</label>
            <input 
              type="month"
              className="px-3 py-2 min-h-[44px] border border-[var(--color-neutral-300)] rounded-md text-sm w-full"
              value={monthStr}
              min={minMonth}
              max={maxMonth}
              onChange={handleMonthChange}
            />
          </div>
        </div>
      )}

      {currentPeriod === "custom" && (
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1">
            <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Start</label>
            <input 
              type="date"
              className="px-3 py-2 min-h-[44px] border border-[var(--color-neutral-300)] rounded-md text-sm w-full"
              value={currentStart || ""}
              onChange={e => useUrlParams ? setInternalStart(e.target.value) : onStartDateChange?.(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">End</label>
            <input 
              type="date" 
              className="px-3 py-2 min-h-[44px] border border-[var(--color-neutral-300)] rounded-md text-sm w-full"
              value={currentEnd || ""}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => useUrlParams ? setInternalEnd(e.target.value) : onEndDateChange?.(e.target.value)}
            />
          </div>
          <Button onClick={handleCustomSearch} className="mb-0">
            Apply
          </Button>
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-sm font-medium ml-2 mb-2">{error}</p>
      )}
    </div>
  );
}
