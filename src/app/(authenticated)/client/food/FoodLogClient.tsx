"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DailyFoodLogView } from "@/components/food/DailyFoodLogView"
import { AddMealDialog } from "@/components/food/AddMealDialog"
import { saveMealLog, deleteMealLog, addWater, removeLastWater, SaveMealInput } from "./actions"

import type { NutritionSummary } from "@/lib/data/nutrition"

type FoodLogClientProps = {
  date: string;
  summary: NutritionSummary;
  hideHeader?: boolean;
}

export function FoodLogClient({
  date,
  summary,
  hideHeader
}: FoodLogClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAddMealOpen, setIsAddMealOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<any>(null)

  // Date Navigation
  // Parse date as local to avoid UTC-offset issues ("2026-08-30" via new Date() is UTC midnight)
  const parseDateLocal = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const handlePrevDay = () => {
    const prev = parseDateLocal(date)
    prev.setDate(prev.getDate() - 1)
    const y = prev.getFullYear()
    const m = String(prev.getMonth() + 1).padStart(2, '0')
    const d = String(prev.getDate()).padStart(2, '0')
    router.push(`/client/food?date=${y}-${m}-${d}`)
  }

  const handleNextDay = () => {
    const next = parseDateLocal(date)
    next.setDate(next.getDate() + 1)
    const y = next.getFullYear()
    const m = String(next.getMonth() + 1).padStart(2, '0')
    const d = String(next.getDate()).padStart(2, '0')
    const nextStr = `${y}-${m}-${d}`

    // Prevent future dates
    const todayStr = new Date().toISOString().split('T')[0]
    if (nextStr > todayStr) return

    router.push(`/client/food?date=${nextStr}`)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = date === todayStr
  const isFutureBlocked = date >= todayStr

  // Actions
  const handleSaveMeal = (mealType: string, items: Omit<SaveMealInput["foodItems"][0], "id">[], photoReference?: string | null, source?: string) => {
    startTransition(async () => {
      const result = await saveMealLog({
        id: editingMeal?.id,
        date,
        mealType,
        photoReference,
        source,
        foodItems: items
      })
      
      if (result.success) {
        setIsAddMealOpen(false)
        setEditingMeal(null)
        router.refresh()
      } else {
        alert(result.error || "Failed to save meal")
      }
    })
  }

  const handleEditMeal = (mealId: string) => {
    const mealToEdit = summary.meals.find((m: any) => m.id === mealId)
    if (mealToEdit) {
      setEditingMeal(mealToEdit)
      setIsAddMealOpen(true)
    }
  }

  const handleDeleteMeal = (mealId: string) => {
    if (!confirm("Are you sure you want to delete this meal?")) return
    
    startTransition(async () => {
      const result = await deleteMealLog(mealId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || "Failed to delete meal")
      }
    })
  }

  const handleAddWater = (amountMl: number) => {
    startTransition(async () => {
      const result = await addWater(date, amountMl)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || "Failed to add water")
      }
    })
  }

  const handleUndoWater = () => {
    startTransition(async () => {
      const result = await removeLastWater(date)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || "Failed to remove water")
      }
    })
  }

  const formattedDate = new Date(date + "T12:00:00Z").toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }) // Add T12 to avoid UTC boundary issues for display

  return (
    <div className={`flex flex-col h-full mx-auto space-y-6 ${!hideHeader ? 'max-w-3xl py-8' : ''}`}>
      
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
              Food & Nutrition
            </h1>
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
              Track what you eat and see your macro breakdown.
            </p>
          </div>
          
          <Button onClick={() => { setEditingMeal(null); setIsAddMealOpen(true); }} disabled={isPending}>
            + Log a Meal
          </Button>
        </div>
      )}
      
      {hideHeader && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditingMeal(null); setIsAddMealOpen(true); }} disabled={isPending}>
            + Log a Meal
          </Button>
        </div>
      )}

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-[var(--color-neutral-200)]">
        <Button variant="ghost" size="sm" onClick={handlePrevDay} disabled={isPending}>
          ← Prev
        </Button>
        <div className="font-semibold text-[var(--color-neutral-800)]">
          {isToday ? "Today" : formattedDate}
        </div>
        <Button variant="ghost" size="sm" onClick={handleNextDay} disabled={isFutureBlocked || isPending}>
          Next →
        </Button>
      </div>

      {/* Data View */}
      <DailyFoodLogView 
        summary={summary}
        onDeleteMeal={handleDeleteMeal}
        onEditMeal={handleEditMeal}
        onAddWater={handleAddWater}
        onUndoWater={handleUndoWater}
        isPending={isPending}
      />

      <AddMealDialog 
        isOpen={isAddMealOpen}
        onClose={() => { setIsAddMealOpen(false); setEditingMeal(null); }}
        onSave={handleSaveMeal}
        isPending={isPending}
        initialData={editingMeal}
      />
    </div>
  )
}
