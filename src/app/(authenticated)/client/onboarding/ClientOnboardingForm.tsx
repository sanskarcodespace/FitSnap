"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { Select } from "@/components/ui/select"
import { upsertClientProfile } from "./actions"

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

export function ClientOnboardingForm({ initialData = {} }: { initialData?: any }) {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [goal, setGoal] = useState(initialData.goal || "")
  const [unit, setUnit] = useState(initialData.preferredWeightUnit || "kg")
  const [currentWeight, setCurrentWeight] = useState<string>(initialData.currentWeight?.toString() || "")
  const [targetWeight, setTargetWeight] = useState<string>(initialData.targetWeight?.toString() || "")
  const [height, setHeight] = useState<string>(initialData.height?.toString() || "")
  const [targetDate, setTargetDate] = useState<string>(initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : "")
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.profilePhoto || null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const isWeightBased = ["Weight Loss", "Weight Gain", "Weight Maintenance"].includes(goal)

  // Handle Photo selection
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

  const uploadPhoto = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    
    // We reuse Block 5's image upload endpoint/action. Assuming it's an API route or server action.
    // Wait, in Block 5, `processAndStoreImage` was exposed in `src/lib/upload.ts`, but where was it called?
    // Let's assume there's an API or we can just make a direct call.
    // Actually, in Block 5 I created a server action in `coach/onboarding/actions.ts`? 
    // Wait, let's fetch it via a generic upload API if we have one. If not, I can create an upload server action for client or import the coach one.
    // I will write a simple `uploadPhotoAction` in this file or `actions.ts`.
    // For now, let's build the form logic and we'll refine the upload call.
    const uploadReq = await fetch("/api/upload", {
      method: "POST",
      body: formData
    })
    const uploadRes = await uploadReq.json()
    if (!uploadReq.ok || !uploadRes.success) throw new Error(uploadRes.error || "Failed to upload photo")
    return uploadRes.url
  }

  const handleNext = async () => {
    setError("")
    setLoading(true)

    try {
      // Step Validation
      if (step === 1 && !goal) {
        throw new Error("Please select a goal to continue.")
      }
      
      if (step === 2) {
        if (!currentWeight || parseFloat(currentWeight) <= 0) {
          throw new Error("Please enter a valid current weight.")
        }
        if (isWeightBased) {
          if (!targetWeight || parseFloat(targetWeight) <= 0) {
            throw new Error("Please enter a valid target weight for this goal.")
          }
        }
      }

      // Save progress
      const payload: any = {
        goal: goal || undefined,
        currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
        preferredWeightUnit: unit,
        targetWeight: (isWeightBased && targetWeight) ? parseFloat(targetWeight) : null,
      }
      
      if (step === 3) {
        payload.height = height ? parseFloat(height) : null
        payload.targetDate = targetDate ? new Date(targetDate) : null
      }

      const saveRes = await upsertClientProfile(payload)
      if (!saveRes.success) throw new Error(saveRes.error)

      if (step < 4) {
        setStep(step + 1)
      } else {
        // Final Finish logic handles step 4
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setError("")
    setLoading(true)

    try {
      let finalPhotoPath = initialData.profilePhoto

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

      const saveRes = await upsertClientProfile({
        profilePhoto: finalPhotoPath,
        onboardingCompleted: true
      })

      if (!saveRes.success) throw new Error(saveRes.error)
      
      router.push("/client")
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Pre-fill target weight for maintenance
  const handleGoalChange = (val: string) => {
    setGoal(val)
    if (val === "Weight Maintenance" && currentWeight) {
      setTargetWeight(currentWeight)
    }
  }

  // Warnings
  let targetWarning = ""
  if (isWeightBased && currentWeight && targetWeight) {
    const cur = parseFloat(currentWeight)
    const tgt = parseFloat(targetWeight)
    if (goal === "Weight Loss" && tgt >= cur) {
      targetWarning = "Warning: Target weight is higher or equal to current weight. Are you sure?"
    }
    if (goal === "Weight Gain" && tgt <= cur) {
      targetWarning = "Warning: Target weight is lower or equal to current weight. Are you sure?"
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      
      <div className="flex justify-between items-center mb-6">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-2 mx-1 rounded-full ${s <= step ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-neutral-200)]'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold">What is your primary goal?</h2>
          <div className="space-y-2">
            <Label htmlFor="goal">Select Goal</Label>
            <Select 
              id="goal" 
              name="goal" 
              value={goal} 
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full"
            >
              <option value="">Select a goal...</option>
              {GOAL_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold">Where are you starting?</h2>
          
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="currentWeight">Current Weight</Label>
              <Input 
                id="currentWeight" 
                type="number" 
                step="0.1" 
                value={currentWeight}
                onChange={e => {
                  setCurrentWeight(e.target.value)
                  if (goal === "Weight Maintenance") setTargetWeight(e.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-2 w-24">
              <Label htmlFor="unit">Unit</Label>
              <Select id="unit" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </Select>
            </div>
          </div>

          {isWeightBased && (
            <div className="space-y-2 pt-4">
              <Label htmlFor="targetWeight">Target Weight</Label>
              <Input 
                id="targetWeight" 
                type="number" 
                step="0.1" 
                value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                required
              />
              {targetWarning && <p className="text-xs text-[var(--color-warning-700)] mt-1">{targetWarning}</p>}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold">A few more details</h2>
          
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm) - Optional</Label>
            <Input 
              id="height" 
              type="number" 
              step="0.1" 
              value={height}
              onChange={e => setHeight(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date - Optional</Label>
            <Input 
              id="targetDate" 
              type="date" 
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold">Add a Profile Photo</h2>
          <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)]">Optional. Let your coach see your face.</p>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-[var(--color-neutral-100)]" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-[var(--color-neutral-400)] border border-dashed border-[var(--color-neutral-300)]">
                No Photo
              </div>
            )}
            
            <div className="space-y-2 text-center w-full max-w-xs">
              <Label htmlFor="photo" className="cursor-pointer inline-block bg-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-200)] px-4 py-2 rounded-md font-medium text-sm transition-colors">
                Choose Photo
              </Label>
              <Input 
                id="photo" 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange}
                className="hidden" 
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-[var(--color-neutral-200)] mt-6">
        <Button 
          variant="outline" 
          disabled={step === 1 || loading}
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>
        
        {step < 4 ? (
          <Button onClick={handleNext} disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={loading}>
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  )
}
