"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/states"
import { TrendChart } from "@/components/ui/trend-chart"
import { fetchClientNutritionHistory } from "./actions"
import type { NutritionHistorySummary } from "@/lib/data/nutrition"
import { Select } from "@/components/ui/select"

export function FoodHistoryTab() {
  const [period, setPeriod] = useState<"7" | "30" | "custom">("7")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [metric, setMetric] = useState<"calories" | "protein" | "carbs" | "fat" | "water">("calories")
  
  const [data, setData] = useState<NutritionHistorySummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Initialize dates for 7 days
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  // Fetch when standard period changes or on mount
  useEffect(() => {
    if (period === "custom") return;
    
    const end = new Date()
    const start = new Date()
    
    if (period === "7") {
      start.setDate(end.getDate() - 6)
    } else if (period === "30") {
      start.setDate(end.getDate() - 29)
    }
    
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    setStartDate(startStr)
    setEndDate(endStr)
    
    fetchData(startStr, endStr)
  }, [period])

  const fetchData = (start: string, end: string) => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await fetchClientNutritionHistory(start, end)
        setData(result)
      } catch (err: any) {
        setError(err.message || "Failed to load history")
      }
    })
  }

  const handleCustomSearch = () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }
    if (startDate > endDate) {
      setError("Start date cannot be after end date")
      return
    }
    const startObj = new Date(startDate)
    const endObj = new Date(endDate)
    const days = Math.floor((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (days > 366) {
      setError("Date range cannot exceed 366 days")
      return
    }
    
    const today = new Date().toISOString().split('T')[0]
    if (endDate > today) {
      setError("End date cannot be in the future")
      return
    }

    fetchData(startDate, endDate)
  }

  const getMetricColor = () => {
    switch(metric) {
      case "calories": return "var(--color-macro-calories)"
      case "protein": return "var(--color-macro-protein)"
      case "carbs": return "var(--color-macro-carbs)"
      case "fat": return "var(--color-macro-fat)"
      case "water": return "var(--color-macro-water)"
    }
  }

  const getTargetLine = () => {
    if (!data || !data.targets) return null
    switch(metric) {
      case "calories": return data.targets.calories
      case "protein": return data.targets.protein
      case "carbs": return data.targets.carbs
      case "fat": return data.targets.fat
      // Chart data for water is in ml, target is in liters — convert to match
      case "water": return data.targets.waterLiters * 1000
    }
  }

  const getAverage = () => {
    if (!data) return 0
    switch(metric) {
      case "calories": return data.averages.calories
      case "protein": return data.averages.protein
      case "carbs": return data.averages.carbs
      case "fat": return data.averages.fat
      case "water": return data.averages.waterMl
    }
  }

  const formatUnit = (m: string) => {
    if (m === "calories") return "kcal"
    if (m === "water") return "ml"
    return "g"
  }

  const chartData = data?.dailyData.map(d => {
    let value = 0;
    let isLogged = false;
    if (metric === "water") {
      value = d.consumed.waterMl;
      isLogged = d.consumed.waterMl > 0;
    } else {
      value = (d.consumed as any)[metric];
      isLogged = d.isLogged;
    }
    return { date: d.date, value, isLogged }
  }) || []

  // Check if we have ANY data logged in the period
  const hasAnyData = metric === "water" 
    ? chartData.some(d => d.isLogged)
    : data && data.daysLogged > 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Controls */}
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
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">End</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <Button className="mb-0" onClick={handleCustomSearch} disabled={isPending}>
              Apply
            </Button>
          </div>
        )}

        <div className="w-full md:w-auto md:ml-auto">
          <label className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1.5 block">Metric</label>
          <Select 
            value={metric} 
            onChange={(e) => setMetric(e.target.value as any)}
            className="w-full md:w-40"
          >
            <option value="calories">Calories</option>
            <option value="protein">Protein</option>
            <option value="carbs">Carbs</option>
            <option value="fat">Fat</option>
            <option value="water">Water</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[var(--color-error-bg)] text-[var(--color-error-text)] rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="bg-white p-6 rounded-xl border border-[var(--color-neutral-200)] shadow-sm min-h-[300px] flex flex-col relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
            <Spinner />
          </div>
        )}

        {!data && !isPending && !error && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        {data && !hasAnyData && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="text-lg font-bold text-[var(--color-neutral-800)] mb-1">No data logged</p>
            <p className="text-[var(--color-neutral-500)] text-sm">No {metric} data logged in this period.</p>
          </div>
        )}

        {data && hasAnyData && (
          <div className="space-y-6">
            <TrendChart 
              data={chartData}
              referenceLine={getTargetLine()}
              metricColor={getMetricColor()}
              yAxisLabel={formatUnit(metric)}
            />

            {!data.hasActiveConnection && (
              <p className="text-xs text-center text-[var(--color-neutral-500)] mt-2">
                You are currently disconnected from your coach. Your historical data is shown without a target line.
              </p>
            )}
            {data.hasActiveConnection && !data.hasTarget && (
              <p className="text-xs text-center text-[var(--color-neutral-500)] mt-2">
                No target is currently set by your coach.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-neutral-100)]">
              <div className="text-center p-4 rounded-xl bg-[var(--color-neutral-50)]">
                <p className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1 uppercase tracking-wider">Avg {metric}</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-800)]">
                  {getAverage()} <span className="text-sm font-medium text-[var(--color-neutral-500)]">{formatUnit(metric)}/day</span>
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-[var(--color-neutral-50)]">
                <p className="text-xs font-semibold text-[var(--color-neutral-500)] mb-1 uppercase tracking-wider">Days Logged</p>
                <p className="text-2xl font-bold text-[var(--color-neutral-800)]">
                  {metric === "water" ? chartData.filter(d => d.isLogged).length : data.daysLogged} 
                  <span className="text-sm font-medium text-[var(--color-neutral-500)]"> / {data.daysInRange}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
