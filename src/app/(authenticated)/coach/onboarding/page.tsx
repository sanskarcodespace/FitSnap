"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Camera, Upload } from "lucide-react"
import { saveOnboarding } from "./actions"

const SPECIALTIES_LIST = [
  { id: "YOGA", label: "Yoga" },
  { id: "FITNESS", label: "Fitness & Personal Training" },
  { id: "WEIGHT_LOSS", label: "Weight Loss" },
  { id: "WEIGHT_GAIN", label: "Weight Gain" },
  { id: "STRENGTH", label: "Strength & Muscle" },
  { id: "NUTRITION", label: "Nutrition Coaching" },
  { id: "WELLNESS", label: "Wellness & General Health" },
]

export default function CoachOnboardingPage() {
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState("")
  const [selectedSpecialties, setSelectedSpecialties] = React.useState<string[]>([])
  
  // Image Preview
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  
  // Auto-capture timezone
  const [timezone, setTimezone] = React.useState("UTC")
  
  React.useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    } catch (e) {
      // ignore
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Basic client-side validation
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds the 5MB limit.")
        return
      }
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file.")
        return
      }
      const url = URL.createObjectURL(file)
      setImagePreview(url)
      setError("")
    }
  }

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.append("isFinalStep", "true")
    formData.append("timezone", timezone)
    
    selectedSpecialties.forEach(s => formData.append("specialties", s))

    try {
      const result = await saveOnboarding(formData)
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      setError("An unexpected error occurred while saving your profile.")
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary-50)] py-12 px-4 flex justify-center">
      <div className="w-full max-w-2xl bg-[var(--background)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-8">
        <div className="space-y-4 mb-8">
          <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-950)]">Complete Your Profile</h1>
          <p className="text-[var(--color-neutral-600)]">Tell us a bit about your coaching practice before we dive in. You can always edit this later.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="error" title="Could not save profile">
              <AlertCircle className="w-4 h-4" />
              {error}
            </Alert>
          )}

          {/* Profile Photo */}
          <div className="space-y-4">
            <Label>Profile Photo (Optional)</Label>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full bg-[var(--color-neutral-100)] border-2 border-dashed border-[var(--color-neutral-300)] flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-[var(--color-neutral-400)]" />
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  id="profilePhoto" 
                  name="profilePhoto" 
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById("profilePhoto")?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] mt-2">Max 5MB (JPG, PNG)</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business / Practice Name *</Label>
            <Input id="businessName" name="businessName" placeholder="e.g. Summit Strength Coaching" required />
          </div>

          <div className="space-y-3">
            <Label>Coaching Specialties *</Label>
            <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-500)] -mt-2 mb-2">Select at least one specialty.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPECIALTIES_LIST.map((spec) => (
                <label key={spec.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-50)] transition-colors">
                  <Checkbox 
                    checked={selectedSpecialties.includes(spec.id)}
                    onCheckedChange={() => toggleSpecialty(spec.id)}
                  />
                  <span className="text-[var(--text-body-sm-size)] font-medium text-[var(--color-neutral-700)]">{spec.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Professional Bio (Optional)</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              placeholder="Tell clients about your background and coaching philosophy..." 
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="credentials">Credentials / Certifications (Optional)</Label>
            <Input id="credentials" name="credentials" placeholder="e.g. NASM-CPT, RYT-200" />
          </div>

          <div className="pt-4 border-t border-[var(--color-neutral-200)] flex justify-end">
            <Button type="submit" size="lg" isLoading={isPending}>
              Complete Onboarding
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
