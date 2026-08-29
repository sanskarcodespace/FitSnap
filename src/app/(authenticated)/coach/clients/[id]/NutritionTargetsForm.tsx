"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, Target, Info } from "lucide-react"
import { saveNutritionTargets } from "./actions"

interface NutritionTarget {
  calorieTarget: number
  proteinTargetGrams: number
  carbTargetGrams: number
  fatTargetGrams: number
  waterTargetLiters: number
  fiberTargetGrams: number | null
}

interface NutritionTargetsFormProps {
  connectionId: string
  initialData?: any // NutritionTarget | null
}

export function NutritionTargetsForm({ connectionId, initialData }: NutritionTargetsFormProps) {
  const [isEditing, setIsEditing] = React.useState(!initialData)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState("")
  
  // State for values to calculate soft warning
  const [calories, setCalories] = React.useState(initialData?.calorieTarget?.toString() || "")
  const [protein, setProtein] = React.useState(initialData?.proteinTargetGrams?.toString() || "")
  const [carbs, setCarbs] = React.useState(initialData?.carbTargetGrams?.toString() || "")
  const [fat, setFat] = React.useState(initialData?.fatTargetGrams?.toString() || "")

  const getMacroWarning = () => {
    const cal = parseInt(calories) || 0
    const p = parseInt(protein) || 0
    const c = parseInt(carbs) || 0
    const f = parseInt(fat) || 0

    if (cal === 0 || (p === 0 && c === 0 && f === 0)) return null

    const macroCals = (p * 4) + (c * 4) + (f * 9)
    const diff = Math.abs(macroCals - cal)
    
    // Warn if difference is more than 15% of target calories
    if (diff > cal * 0.15) {
      return `Warning: Your macros total ~${macroCals} kcal, which differs from your ${cal} kcal target.`
    }
    return null
  }

  const warning = getMacroWarning()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    try {
      const result = await saveNutritionTargets(connectionId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsEditing(false)
      }
    } catch (err) {
      setError("An unexpected error occurred while saving targets. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  if (!isEditing && initialData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-[var(--color-secondary-50)] p-4 rounded-lg">
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-600)] font-medium uppercase tracking-wider">Calories</p>
            <p className="text-2xl font-bold text-[var(--color-primary-900)]">{initialData.calorieTarget} <span className="text-sm font-normal text-[var(--color-neutral-500)]">kcal</span></p>
          </div>
          <div className="bg-[var(--color-secondary-50)] p-4 rounded-lg">
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-600)] font-medium uppercase tracking-wider">Protein</p>
            <p className="text-2xl font-bold text-[var(--color-primary-900)]">{initialData.proteinTargetGrams} <span className="text-sm font-normal text-[var(--color-neutral-500)]">g</span></p>
          </div>
          <div className="bg-[var(--color-secondary-50)] p-4 rounded-lg">
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-600)] font-medium uppercase tracking-wider">Carbs</p>
            <p className="text-2xl font-bold text-[var(--color-primary-900)]">{initialData.carbTargetGrams} <span className="text-sm font-normal text-[var(--color-neutral-500)]">g</span></p>
          </div>
          <div className="bg-[var(--color-secondary-50)] p-4 rounded-lg">
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-600)] font-medium uppercase tracking-wider">Fat</p>
            <p className="text-2xl font-bold text-[var(--color-primary-900)]">{initialData.fatTargetGrams} <span className="text-sm font-normal text-[var(--color-neutral-500)]">g</span></p>
          </div>
          <div className="bg-[var(--color-secondary-50)] p-4 rounded-lg">
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-600)] font-medium uppercase tracking-wider">Water</p>
            <p className="text-2xl font-bold text-[var(--color-primary-900)]">{initialData.waterTargetLiters} <span className="text-sm font-normal text-[var(--color-neutral-500)]">L</span></p>
          </div>
          <div className="bg-[var(--color-secondary-50)] p-4 rounded-lg">
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-600)] font-medium uppercase tracking-wider">Fiber</p>
            <p className="text-2xl font-bold text-[var(--color-primary-900)]">{initialData.fiberTargetGrams ? initialData.fiberTargetGrams : "—"} <span className="text-sm font-normal text-[var(--color-neutral-500)]">{initialData.fiberTargetGrams ? "g" : ""}</span></p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Targets</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" title="Could not save targets">
          <AlertCircle className="w-4 h-4" />
          {error}
        </Alert>
      )}

      {warning && (
        <Alert variant="warning" title="Consistency Note">
          <Info className="w-4 h-4" />
          {warning}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="calorieTarget">Daily Calories (kcal) *</Label>
          <Input 
            id="calorieTarget" 
            name="calorieTarget" 
            type="number" 
            min="500" 
            max="10000" 
            required 
            value={calories}
            onChange={e => setCalories(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="waterTargetLiters">Daily Water (Liters) *</Label>
          <Input 
            id="waterTargetLiters" 
            name="waterTargetLiters" 
            type="number" 
            step="0.1"
            min="0.5" 
            max="10" 
            required 
            defaultValue={initialData?.waterTargetLiters}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proteinTargetGrams">Protein (g) *</Label>
          <Input 
            id="proteinTargetGrams" 
            name="proteinTargetGrams" 
            type="number" 
            min="1" 
            max="1000" 
            required 
            value={protein}
            onChange={e => setProtein(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carbTargetGrams">Carbohydrates (g) *</Label>
          <Input 
            id="carbTargetGrams" 
            name="carbTargetGrams" 
            type="number" 
            min="1" 
            max="1000" 
            required 
            value={carbs}
            onChange={e => setCarbs(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fatTargetGrams">Fat (g) *</Label>
          <Input 
            id="fatTargetGrams" 
            name="fatTargetGrams" 
            type="number" 
            min="1" 
            max="500" 
            required 
            value={fat}
            onChange={e => setFat(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fiberTargetGrams">Fiber (g) - Optional</Label>
          <Input 
            id="fiberTargetGrams" 
            name="fiberTargetGrams" 
            type="number" 
            min="1" 
            max="200" 
            defaultValue={initialData?.fiberTargetGrams || ""}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-neutral-200)]">
        {initialData && (
          <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isPending}>
          Save Targets
        </Button>
      </div>
    </form>
  )
}
