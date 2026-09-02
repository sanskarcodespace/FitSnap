"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"

type FoodItemInput = {
  id: string; // temp id for UI
  name: string;
  portionDescription: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  originType?: string; // "manual" | "ai_detected"
}

type MealLogInput = {
  id?: string;
  mealType: string;
  photoReference?: string | null;
  source?: string;
  foodItems: FoodItemInput[];
}

type AddMealDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealType: string, items: Omit<FoodItemInput, "id">[], photoReference?: string | null, source?: string) => void;
  isPending: boolean;
  initialData?: MealLogInput | null;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"]

export function AddMealDialog({ isOpen, onClose, onSave, isPending, initialData }: AddMealDialogProps) {
  const [entryMode, setEntryMode] = useState<"photo" | "manual">("photo")
  const [mealType, setMealType] = useState("Breakfast")
  const [items, setItems] = useState<FoodItemInput[]>([])
  
  // Photo & AI State
  const [photoReference, setPhotoReference] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisEmpty, setAnalysisEmpty] = useState(false)
  const [isAiAssisted, setIsAiAssisted] = useState(false)
  const [isCalculatingText, setIsCalculatingText] = useState(false)
  
  // Initialize from initialData if present
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setMealType(initialData.mealType)
        setItems(initialData.foodItems.map(i => ({...i, id: i.id || Math.random().toString()})))
        setPhotoReference(initialData.photoReference || null)
        setPhotoPreview(initialData.photoReference || null)
        setIsAiAssisted(initialData.source === "ai_assisted")
        setEntryMode("manual") // skip photo capture if editing
        setAnalysisError(null)
        setAnalysisEmpty(false)
      } else {
        setMealType("Breakfast")
        setItems([])
        setPhotoReference(null)
        setPhotoPreview(null)
        setIsAiAssisted(false)
        setEntryMode("photo")
        setAnalysisError(null)
        setAnalysisEmpty(false)
      }
    }
  }, [isOpen, initialData])
  
  // Current item being edited
  const [currentItem, setCurrentItem] = useState<FoodItemInput>({
    id: "",
    name: "",
    portionDescription: "",
    calories: 0,
    proteinGrams: 0,
    carbGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    originType: "manual"
  })

  if (!isOpen) return null

  const handleAddItem = () => {
    if (!currentItem.name) return
    setItems([...items, { ...currentItem, id: Math.random().toString(), originType: "manual" }])
    setCurrentItem({
      id: "",
      name: "",
      portionDescription: "",
      calories: 0,
      proteinGrams: 0,
      carbGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
      originType: "manual"
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const handleAutoCalculate = async () => {
    if (!currentItem.name) return
    setIsCalculatingText(true)
    try {
      const { analyzeFoodTextAction } = await import("@/app/(authenticated)/client/food/actions")
      const res = await analyzeFoodTextAction(currentItem.name, currentItem.portionDescription)
      
      if (res.error) {
        alert(res.error)
      } else if (res.item) {
        setCurrentItem({
          ...currentItem,
          name: res.item.name || currentItem.name,
          portionDescription: res.item.portionDescription || currentItem.portionDescription,
          calories: res.item.calories || 0,
          proteinGrams: res.item.proteinGrams || 0,
          carbGrams: res.item.carbGrams || 0,
          fatGrams: res.item.fatGrams || 0,
          fiberGrams: res.item.fiberGrams || 0,
          originType: "ai_detected"
        })
      }
    } catch (e) {
      alert("Failed to calculate macros.")
    } finally {
      setIsCalculatingText(false)
    }
  }

  const handleSave = () => {
    if (items.length === 0) return
    // Clean up temp ids before passing back
    const cleanedItems = items.map(({ id: _id, ...rest }) => rest)
    const source = isAiAssisted ? "ai_assisted" : "manual"
    onSave(mealType, cleanedItems, photoReference, source)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPhotoPreview(localUrl)
    setPhotoReference(null) // Clear existing if any
    setAnalysisError(null)
    setAnalysisEmpty(false)
  }

  const triggerAnalysis = async (tempUrl: string) => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisEmpty(false)
    setIsAiAssisted(false)

    try {
      const { analyzeFoodPhoto } = await import("@/app/(authenticated)/client/food/actions")
      const aiRes = await analyzeFoodPhoto(tempUrl)
      
      if (aiRes.error) {
        setAnalysisError("We couldn't analyze this photo right now — please add the details below.")
        setEntryMode("manual")
      } else if (aiRes.items && aiRes.items.length > 0) {
        if (aiRes.items.length > 15) {
          // Implausibly large number of items
          setAnalysisEmpty(true)
          setEntryMode("manual")
        } else {
          const newItems = aiRes.items.map((i: any) => ({
            id: Math.random().toString(),
            name: i.name || "Unknown Item",
            portionDescription: i.portionDescription || "",
            calories: i.calories || 0,
            proteinGrams: i.proteinGrams || 0,
            carbGrams: i.carbGrams || 0,
            fatGrams: i.fatGrams || 0,
            fiberGrams: i.fiberGrams || 0,
            originType: "ai_detected"
          }))
          setItems(newItems)
          setIsAiAssisted(true)
          setEntryMode("manual")
        }
      } else {
        setAnalysisEmpty(true)
        setEntryMode("manual")
      }
    } catch (e) {
      setAnalysisError("We couldn't analyze this photo right now — please add the details below.")
      setEntryMode("manual")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirmPhoto = async () => {
    const fileInput = document.getElementById("photo-capture") as HTMLInputElement
    const file = fileInput?.files?.[0]
    
    // If we already have a photoReference and no new file, just retry analysis
    if (!file && photoReference) {
      await triggerAnalysis(photoReference)
      return
    }

    if (!file) {
      setEntryMode("manual")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("photo", file)

    try {
      const { uploadTempFoodPhoto } = await import("@/app/(authenticated)/client/food/actions")
      const res = await uploadTempFoodPhoto(formData)
      if (res.error) {
        alert(res.error)
      } else if (res.tempUrl) {
        setPhotoReference(res.tempUrl)
        setPhotoPreview(res.tempUrl)
        setIsUploading(false) // stop upload state
        await triggerAnalysis(res.tempUrl)
      }
    } catch (e) {
      alert("Failed to upload photo")
      setIsUploading(false)
    }
  }

  const handleRetakePhoto = () => {
    setPhotoPreview(null)
    setPhotoReference(null)
    const fileInput = document.getElementById("photo-capture") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setPhotoReference(null)
  }

  // Soft validation check (15% margin)
  // 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal
  const macroCalories = (currentItem.proteinGrams * 4) + (currentItem.carbGrams * 4) + (currentItem.fatGrams * 9)
  const isDiscrepant = currentItem.calories > 0 && Math.abs(macroCalories - currentItem.calories) / currentItem.calories > 0.15

  const totalMealCalories = items.reduce((s, i) => s + i.calories, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-neutral-200)] flex justify-between items-center bg-[var(--color-neutral-50)]">
          <h2 className="font-bold text-lg text-[var(--color-neutral-800)]">Log a Meal</h2>
          <button 
            onClick={onClose}
            className="text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]"
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
          
          {/* Tabs */}
          {!initialData && (
            <div className="flex bg-[var(--color-neutral-100)] p-1 rounded-lg mb-6 shrink-0">
              <button
                onClick={() => setEntryMode("photo")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${entryMode === "photo" ? "bg-white text-[var(--color-neutral-900)] shadow-sm" : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"}`}
              >
                Add via Photo
              </button>
              <button
                onClick={() => setEntryMode("manual")}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${entryMode === "manual" ? "bg-white text-[var(--color-neutral-900)] shadow-sm" : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"}`}
              >
                Enter Manually
              </button>
            </div>
          )}

          {entryMode === "photo" ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              {!photoPreview ? (
                <>
                  <div className="w-full h-48 border-2 border-dashed border-[var(--color-neutral-300)] rounded-xl flex flex-col items-center justify-center bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer" onClick={() => document.getElementById("photo-capture")?.click()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="font-medium text-sm">Take Photo or Upload</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    id="photo-capture" 
                    className="hidden" 
                    onChange={handlePhotoUpload} 
                  />
                </>
              ) : (
                <div className="w-full flex flex-col items-center space-y-4">
                  <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-[var(--color-neutral-200)] shadow-sm bg-black aspect-square">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-contain" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-medium">Uploading & Optimizing...</p>
                      </div>
                    )}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                        <div className="w-8 h-8 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-medium">Analyzing Photo...</p>
                      </div>
                    )}
                  </div>
                  {!isUploading && !isAnalyzing && (
                    <div className="flex gap-3 w-full max-w-sm">
                      <Button variant="outline" className="flex-1" onClick={handleRetakePhoto} disabled={isUploading || isAnalyzing}>Retake</Button>
                      <Button variant="primary" className="flex-1" onClick={handleConfirmPhoto} disabled={isUploading || isAnalyzing}>Confirm Photo</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              
              {photoPreview && (
                <div className="bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] rounded-lg p-3 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-black shrink-0 border border-[var(--color-neutral-200)]">
                    <img src={photoPreview} alt="Meal Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-neutral-800)]">Photo Attached</p>
                    {isAiAssisted ? (
                      <p className="text-xs text-[var(--color-primary-600)] mt-0.5 font-medium">✓ AI detected items from photo</p>
                    ) : (
                      <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">Please enter meal details manually.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      id="photo-capture-replace" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setIsUploading(true)
                        const formData = new FormData()
                        formData.append("photo", file)
                        try {
                          const { uploadTempFoodPhoto } = await import("@/app/(authenticated)/client/food/actions")
                          const res = await uploadTempFoodPhoto(formData)
                          if (res.error) {
                            alert(res.error)
                          } else if (res.tempUrl) {
                            setPhotoReference(res.tempUrl)
                            setPhotoPreview(res.tempUrl)
                          }
                        } catch (err) {
                          alert("Failed to upload replacement photo")
                        } finally {
                          setIsUploading(false)
                        }
                      }} 
                    />
                    <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => document.getElementById("photo-capture-replace")?.click()} disabled={isUploading}>Replace</Button>
                    <Button variant="secondary" size="sm" className="h-6 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100" onClick={handleRemovePhoto} disabled={isUploading}>Remove</Button>
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-md">
                  <strong>Analysis Error:</strong> {analysisError}
                </div>
              )}
              {analysisEmpty && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-md">
                  We couldn't detect any food items in this photo. Please add them manually below.
                </div>
              )}

              {/* Meal Type */}
              <div>
            <label className="block text-sm font-semibold text-[var(--color-neutral-700)] mb-2">Meal Type</label>
            <div className="flex gap-2">
              {MEAL_TYPES.map(type => (
                <Button 
                  key={type}
                  variant={mealType === type ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setMealType(type)}
                  className="flex-1"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <hr className="border-[var(--color-neutral-200)]" />

          {/* Added Items List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[var(--color-neutral-800)]">Added Items</h3>
                <span className="text-sm font-medium text-[var(--color-neutral-600)]">{totalMealCalories} kcal total</span>
              </div>
              <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 space-y-3 border border-[var(--color-neutral-200)]">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded border border-[var(--color-neutral-100)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-[var(--color-neutral-800)]">{item.name}</p>
                        {item.originType === "ai_detected" && (
                          <Tooltip content="Detected by AI from your photo">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 border-purple-200">AI Suggested</Badge>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                        {item.calories} kcal · {item.proteinGrams}p · {item.carbGrams}c · {item.fatGrams}f
                        {item.portionDescription ? ` (${item.portionDescription})` : ""}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium p-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Item Form */}
          <div className="space-y-4 bg-white border border-[var(--color-neutral-200)] rounded-lg p-4">
            <h3 className="font-semibold text-[var(--color-neutral-800)]">Add Food Item</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-neutral-600)] mb-1">Food Name *</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-[var(--color-neutral-300)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                  placeholder="e.g. Chicken Breast"
                  value={currentItem.name}
                  onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-neutral-600)] mb-1">Portion (Optional)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 rounded-lg border border-[var(--color-neutral-300)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                    placeholder="e.g. 1 medium piece, or 150g"
                    value={currentItem.portionDescription}
                    onChange={e => setCurrentItem({...currentItem, portionDescription: e.target.value})}
                  />
                  <Button 
                    variant="outline" 
                    className="shrink-0 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                    onClick={handleAutoCalculate}
                    disabled={!currentItem.name || isCalculatingText}
                  >
                    {isCalculatingText ? "Calculating..." : "✨ Auto-Calculate"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--color-neutral-600)] mb-1">Calories *</label>
                  <input 
                    type="number" min="0"
                    className="w-full rounded-lg border border-[var(--color-neutral-300)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                    value={currentItem.calories || ""}
                    onChange={e => setCurrentItem({...currentItem, calories: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-neutral-600)] mb-1">Protein (g)</label>
                  <input 
                    type="number" min="0"
                    className="w-full rounded-lg border border-[var(--color-neutral-300)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                    value={currentItem.proteinGrams || ""}
                    onChange={e => setCurrentItem({...currentItem, proteinGrams: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-neutral-600)] mb-1">Carbs (g)</label>
                  <input 
                    type="number" min="0"
                    className="w-full rounded-lg border border-[var(--color-neutral-300)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                    value={currentItem.carbGrams || ""}
                    onChange={e => setCurrentItem({...currentItem, carbGrams: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-neutral-600)] mb-1">Fat (g)</label>
                  <input 
                    type="number" min="0"
                    className="w-full rounded-lg border border-[var(--color-neutral-300)] p-2 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                    value={currentItem.fatGrams || ""}
                    onChange={e => setCurrentItem({...currentItem, fatGrams: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              {isDiscrepant && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  <span>
                    <strong>Check your math:</strong> The macros entered ({currentItem.proteinGrams}g P, {currentItem.carbGrams}g C, {currentItem.fatGrams}g F) add up to ~{macroCalories} kcal, but you entered {currentItem.calories} kcal. You can still add it, but it might skew your totals.
                  </span>
                </div>
              )}

              <Button 
                variant="secondary" 
                className="w-full"
                onClick={handleAddItem}
                disabled={!currentItem.name || currentItem.calories <= 0}
              >
                Add Item to Meal
              </Button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Footer */}
        <div className="p-4 border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isPending || isUploading}>Cancel</Button>
          {entryMode === "manual" && (
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={items.length === 0 || isPending || isUploading}
            >
              {isPending ? "Saving..." : "Save Meal"}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
