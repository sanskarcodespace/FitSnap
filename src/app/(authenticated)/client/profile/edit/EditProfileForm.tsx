"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { Select } from "@/components/ui/select"
import { upsertClientProfile } from "../../onboarding/actions"

const GOAL_OPTIONS = [
  "Weight Loss",
  "Weight Gain",
  "Weight Maintenance",
  "Muscle/Strength Development",
  "General Fitness",
  "Yoga Improvement",
  "Better Nutrition",
  "Lifestyle Improvement"
]

export function EditProfileForm({ profile }: { profile: any }) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [goal, setGoal] = useState(profile.goal || "")
  const [unit, setUnit] = useState(profile.preferredWeightUnit || "kg")
  const [currentWeight, setCurrentWeight] = useState<string>(profile.currentWeight?.toString() || "")
  const [targetWeight, setTargetWeight] = useState<string>(profile.targetWeight?.toString() || "")
  const [height, setHeight] = useState<string>(profile.height?.toString() || "")
  const [targetDate, setTargetDate] = useState<string>(profile.targetDate ? new Date(profile.targetDate).toISOString().split('T')[0] : "")
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.profilePhoto || null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const isWeightBased = ["Weight Loss", "Weight Gain", "Weight Maintenance"].includes(goal)

  const handleUnitChange = (newUnit: string) => {
    if (newUnit === unit) return
    const multiplier = newUnit === "lb" ? 2.20462 : 0.453592
    
    if (currentWeight) {
      setCurrentWeight((parseFloat(currentWeight) * multiplier).toFixed(1))
    }
    if (targetWeight) {
      setTargetWeight((parseFloat(targetWeight) * multiplier).toFixed(1))
    }
    setUnit(newUnit)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("File must be less than 5MB")
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!currentWeight || parseFloat(currentWeight) <= 0) {
        throw new Error("Current weight must be valid.")
      }
      if (isWeightBased && (!targetWeight || parseFloat(targetWeight) <= 0)) {
        throw new Error("Target weight must be valid for your goal.")
      }

      let finalPhotoPath = profile.profilePhoto

      if (photoFile) {
        const formData = new FormData()
        formData.append("file", photoFile)
        const uploadReq = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })
        const uploadRes = await uploadReq.json()
        if (!uploadReq.ok || !uploadRes.success) throw new Error(uploadRes.error || "Failed to upload photo")
        finalPhotoPath = uploadRes.url
      }

      const payload: any = {
        goal,
        currentWeight: parseFloat(currentWeight),
        preferredWeightUnit: unit,
        targetWeight: isWeightBased && targetWeight ? parseFloat(targetWeight) : null,
        height: height ? parseFloat(height) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        profilePhoto: finalPhotoPath,
      }

      const saveRes = await upsertClientProfile(payload)
      if (!saveRes.success) throw new Error(saveRes.error)
      
      router.push("/client")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
      {error && <Alert variant="error">{error}</Alert>}
      
      {/* Photo */}
      <div className="flex flex-col items-center gap-4 py-4">
        {photoPreview ? (
          <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-neutral-100)]" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-[var(--color-neutral-400)] border border-dashed border-[var(--color-neutral-300)]">
            No Photo
          </div>
        )}
        
        <Label htmlFor="photo" className="cursor-pointer text-[var(--color-primary-600)] hover:underline font-medium text-sm">
          Change Photo
        </Label>
        <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Select 
            id="goal" 
            value={goal} 
            onChange={(e) => setGoal(e.target.value)}
            className="w-full"
          >
            {GOAL_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
        </div>

        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="currentWeight">Current Weight</Label>
            <Input 
              id="currentWeight" 
              type="number" 
              step="0.1" 
              value={currentWeight}
              onChange={e => setCurrentWeight(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 w-24">
            <Label htmlFor="unit">Unit</Label>
            <Select id="unit" value={unit} onChange={e => handleUnitChange(e.target.value)}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </Select>
          </div>
        </div>

        {isWeightBased && (
          <div className="space-y-2">
            <Label htmlFor="targetWeight">Target Weight</Label>
            <Input 
              id="targetWeight" 
              type="number" 
              step="0.1" 
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input 
            id="height" 
            type="number" 
            step="0.1" 
            value={height}
            onChange={e => setHeight(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetDate">Target Date</Label>
          <Input 
            id="targetDate" 
            type="date" 
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" type="button" onClick={() => router.push("/client")}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
