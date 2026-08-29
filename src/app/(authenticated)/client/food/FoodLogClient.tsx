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
}

export function FoodLogClient({
  date,
  summary
}: FoodLogClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAddMealOpen, setIsAddMealOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<any>(null)

  // Date Navigation
  const currentDateObj = new Date(date)
  
  // To avoid timezone issues when manipulating just the date string part
  const handlePrevDay = () => {
    const prev = new Date(currentDateObj)
    prev.setDate(prev.getDate() - 1)
    router.push(`/client/food?date=${prev.toISOString().split('T')[0]}`)
  }

  const handleNextDay = () => {
    const next = new Date(currentDateObj)
    next.setDate(next.getDate() + 1)
    
    // Prevent future dates
    const todayStr = new Date().toISOString().split('T')[0]
    if (next.toISOString().split('T')[0] > todayStr) return

    router.push(`/client/food?date=${next.toISOString().split('T')[0]}`)
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
    const mealToEdit = meals.find(m => m.id === mealId)
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
    <div className="flex flex-col h-full max-w-3xl mx-auto py-8 space-y-6">
      
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
        meals={meals}
        waterEntries={waterEntries}
        targetCalories={targetCalories}
        targetProtein={targetProtein}
        targetCarbs={targetCarbs}
        targetFat={targetFat}
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
