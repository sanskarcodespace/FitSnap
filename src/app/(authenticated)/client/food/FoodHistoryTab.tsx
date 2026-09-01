"use client"

import React, { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { PeriodSelector } from "@/components/ui/period-selector"
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
        <PeriodSelector 
          period={period}
          onPeriodChange={(p, s, e) => {
            setPeriod(p as any)
            setStartDate(s)
            setEndDate(e)
            fetchData(s, e)
          }}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onApplyCustom={handleCustomSearch}
        />
      </div>
    </div>
  )
}
