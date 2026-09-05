"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"

// ─── Types ───────────────────────────────────────────────────────────────────

type FoodItemInput = {
  id: string; // temp id for UI
  name: string;
  portionDescription: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  originType?: string; // "manual" | "ai_detected" | "user_corrected"
  originalOriginType?: string; // tracks original source if being edited
}

type MealLogInput = {
  id?: string;
  mealType: string;
  photoReference?: string | null;
  source?: string;
  foodItems: FoodItemInput[];
}

/** Raw detected food from AI image analysis (no nutrition yet) */
type ReviewFoodItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isEstimated: boolean;
}

/** Calculated nutrition per food item */
type CalculatedItem = {
  name: string;
  quantity: number;
  unit: string;
  portionDescription: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
}

type AddMealDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealType: string, items: Omit<FoodItemInput, "id">[], photoReference?: string | null, source?: string) => void;
  isPending: boolean;
  initialData?: MealLogInput | null;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"]
const UNIT_OPTIONS = ["g", "kg", "ml", "piece", "pieces", "bowl", "cup", "serving"]

// ─── Component ───────────────────────────────────────────────────────────────

export function AddMealDialog({ isOpen, onClose, onSave, isPending, initialData }: AddMealDialogProps) {
  // Entry mode: select → photo → review → results → manual
  const [entryMode, setEntryMode] = useState<"select" | "photo" | "review" | "results" | "manual">("select")
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
  
  // Review state (for the new AI review flow)
  const [reviewItems, setReviewItems] = useState<ReviewFoodItem[]>([])
  const [isAddingFood, setIsAddingFood] = useState(false)
  const [newFoodName, setNewFoodName] = useState("")
  const [newFoodQuantity, setNewFoodQuantity] = useState("")
  const [newFoodUnit, setNewFoodUnit] = useState("g")

  // Results state
  const [calculatedItems, setCalculatedItems] = useState<CalculatedItem[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [calcError, setCalcError] = useState<string | null>(null)

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
        setEntryMode("select")
        setAnalysisError(null)
        setAnalysisEmpty(false)
        setReviewItems([])
        setCalculatedItems([])
        setCalcError(null)
        setIsAddingFood(false)
      }
    }
  }, [isOpen, initialData])
  
  // Current item being edited (manual mode)
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

  // ─── Manual mode handlers (unchanged) ──────────────────────────────────────

  const handleAddItem = () => {
    if (!currentItem.name) return
    
    let finalOriginType = currentItem.originType || "manual"
    if (currentItem.originalOriginType === "ai_detected") {
      finalOriginType = "user_corrected"
    }

    setItems([...items, { ...currentItem, id: Math.random().toString(), originType: finalOriginType, originalOriginType: undefined }])
    
    setCurrentItem({
      id: "",
      name: "",
      portionDescription: "",
      calories: 0,
      proteinGrams: 0,
      carbGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
      originType: "manual",
      originalOriginType: undefined
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const handleEditItem = (item: FoodItemInput) => {
    setItems(items.filter(i => i.id !== item.id))
    setCurrentItem({
      ...item,
      originalOriginType: item.originType
    })
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
    let finalItems = [...items]
    if (currentItem.name && currentItem.calories > 0) {
      let finalOriginType = currentItem.originType || "manual"
      if (currentItem.originalOriginType === "ai_detected") {
        finalOriginType = "user_corrected"
      }
      finalItems.push({ ...currentItem, id: Math.random().toString(), originType: finalOriginType, originalOriginType: undefined })
    }
    
    if (finalItems.length === 0) return
    
    const cleanedItems = finalItems.map(({ id: _id, originalOriginType: _orig, ...rest }) => rest)
    const source = isAiAssisted ? "ai_assisted" : "manual"
    onSave(mealType, cleanedItems, photoReference, source)
  }

  // ─── Photo handlers ────────────────────────────────────────────────────────

  const triggerAnalysis = async (tempUrl: string) => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisEmpty(false)

    try {
      const { analyzeFoodPhoto } = await import("@/app/(authenticated)/client/food/actions")
      const aiRes = await analyzeFoodPhoto(tempUrl)
      
      if (aiRes.error) {
        setAnalysisError("We couldn't analyze this photo right now — please add the details manually.")
        setEntryMode("manual")
      } else if (aiRes.items && aiRes.items.length > 0) {
        if (aiRes.items.length > 15) {
          setAnalysisEmpty(true)
          setEntryMode("manual")
        } else {
          // Convert AI response to ReviewFoodItem format
          const reviewData: ReviewFoodItem[] = aiRes.items.map((item: any) => ({
            id: Math.random().toString(),
            name: item.name || "Unknown Food",
            quantity: item.quantity || 0,
            unit: item.unit || "g",
            isEstimated: item.isEstimated !== false,
          }))
          setReviewItems(reviewData)
          setIsAiAssisted(true)
          setEntryMode("review")
        }
      } else {
        setAnalysisEmpty(true)
        setEntryMode("manual")
      }
    } catch (e) {
      setAnalysisError("We couldn't analyze this photo right now — please add the details manually.")
      setEntryMode("manual")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setPhotoPreview(localUrl)
    setPhotoReference(null)
    setAnalysisError(null)
    setAnalysisEmpty(false)

    // Immediately upload and analyze — no extra button click needed
    setIsUploading(true)
    const formData = new FormData()
    formData.append("photo", file)

    try {
      const { uploadTempFoodPhoto } = await import("@/app/(authenticated)/client/food/actions")
      const res = await uploadTempFoodPhoto(formData)
      if (res.error) {
        setIsUploading(false)
        setAnalysisError(res.error)
        setEntryMode("manual")
        return
      }
      if (res.tempUrl) {
        setPhotoReference(res.tempUrl)
        setPhotoPreview(res.tempUrl)
        setIsUploading(false)
        // Auto-trigger AI analysis
        await triggerAnalysis(res.tempUrl)
      }
    } catch (err) {
      setIsUploading(false)
      setAnalysisError("Failed to upload photo. Please try again.")
      setEntryMode("manual")
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

  // ─── Review mode handlers ─────────────────────────────────────────────────

  const handleReviewItemChange = (id: string, field: keyof ReviewFoodItem, value: string | number) => {
    setReviewItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (field === "quantity") {
        return { ...item, quantity: typeof value === "number" ? value : parseFloat(value) || 0 }
      }
      return { ...item, [field]: value }
    }))
  }

  const handleDeleteReviewItem = (id: string) => {
    setReviewItems(prev => prev.filter(item => item.id !== id))
  }

  const handleAddReviewFood = () => {
    if (!newFoodName.trim()) return
    const qty = parseFloat(newFoodQuantity)
    if (isNaN(qty) || qty <= 0) return

    setReviewItems(prev => [...prev, {
      id: Math.random().toString(),
      name: newFoodName.trim(),
      quantity: qty,
      unit: newFoodUnit,
      isEstimated: false,
    }])

    setNewFoodName("")
    setNewFoodQuantity("")
    setNewFoodUnit("g")
    setIsAddingFood(false)
  }

  const handleCalculateNutrition = async () => {
    // Validate
    const invalid = reviewItems.find(item => !item.name.trim() || item.quantity <= 0)
    if (invalid) {
      setCalcError(`Please fix "${invalid.name || "unnamed item"}" — name and quantity are required.`)
      return
    }
    if (reviewItems.length === 0) {
      setCalcError("No food items to calculate. Add at least one item.")
      return
    }

    setIsCalculating(true)
    setCalcError(null)

    try {
      const { calculateNutritionAction } = await import("@/app/(authenticated)/client/food/actions")
      const payload = reviewItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }))

      const res = await calculateNutritionAction(payload)

      if (res.error) {
        setCalcError(res.error)
      } else if (res.items) {
        setCalculatedItems(res.items)
        setEntryMode("results")
      }
    } catch (e) {
      setCalcError("Failed to calculate nutrition. Please try again.")
    } finally {
      setIsCalculating(false)
    }
  }

  // ─── Results mode handlers ────────────────────────────────────────────────

  const handleSaveFromResults = () => {
    if (calculatedItems.length === 0) return

    const finalItems = calculatedItems.map(item => ({
      name: item.name,
      portionDescription: item.portionDescription,
      calories: item.calories,
      proteinGrams: item.proteinGrams,
      carbGrams: item.carbGrams,
      fatGrams: item.fatGrams,
      fiberGrams: item.fiberGrams,
      originType: "ai_detected" as string,
    }))

    onSave(mealType, finalItems, photoReference, "ai_assisted")
  }

  const handleBackToReview = () => {
    setEntryMode("review")
    setCalcError(null)
  }

  // ─── Computed values ──────────────────────────────────────────────────────

  // Soft validation check (15% margin)
  const macroCalories = (currentItem.proteinGrams * 4) + (currentItem.carbGrams * 4) + (currentItem.fatGrams * 9)
  const isDiscrepant = currentItem.calories > 0 && Math.abs(macroCalories - currentItem.calories) / currentItem.calories > 0.15

  const totalMealCalories = items.reduce((s, i) => s + i.calories, 0)

  // Results totals
  const resultsTotals = calculatedItems.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.proteinGrams,
    carbs: acc.carbs + item.carbGrams,
    fat: acc.fat + item.fatGrams,
    fiber: acc.fiber + item.fiberGrams,
    sugar: acc.sugar + item.sugarGrams,
    sodium: acc.sodium + item.sodiumMg,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-neutral-200)] flex justify-between items-center bg-[var(--color-neutral-50)]">
          <h2 className="font-bold text-lg text-[var(--color-neutral-800)]">
            {entryMode === "review" ? "Review Detected Foods" : entryMode === "results" ? "Nutrition Summary" : "Log a Meal"}
          </h2>
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
          
          {/* ─── SELECT MODE ─── */}
          {entryMode === "select" && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-4">
              <button 
                onClick={() => setEntryMode("photo")}
                className="w-full bg-[var(--color-neutral-50)] hover:bg-purple-50 border-2 border-[var(--color-neutral-200)] hover:border-purple-300 rounded-2xl p-6 transition-all text-left group flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📷</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-neutral-800)] group-hover:text-purple-900">Scan with Photo</h3>
                  <p className="text-sm text-[var(--color-neutral-500)] mt-1">Upload or take a photo. AI will identify foods and estimate portions for you to review.</p>
                </div>
              </button>

              <button 
                onClick={() => setEntryMode("manual")}
                className="w-full bg-[var(--color-neutral-50)] hover:bg-blue-50 border-2 border-[var(--color-neutral-200)] hover:border-blue-300 rounded-2xl p-6 transition-all text-left group flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">✍️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-neutral-800)] group-hover:text-blue-900">Enter Manually</h3>
                  <p className="text-sm text-[var(--color-neutral-500)] mt-1">Type in your food and portion. We&apos;ll help calculate the macros.</p>
                </div>
              </button>
            </div>
          )}

          {/* ─── PHOTO MODE ─── */}
          {entryMode === "photo" && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              {!photoPreview ? (
                <>
                  <div className="w-full h-48 border-2 border-dashed border-[var(--color-neutral-300)] rounded-xl flex flex-col items-center justify-center bg-[var(--color-neutral-50)] text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer" onClick={() => document.getElementById("photo-capture")?.click()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="font-medium text-sm">Take Photo or Upload</span>
                    <span className="text-xs text-[var(--color-neutral-400)] mt-1">Gallery, Camera, or File</span>
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
                        <p className="font-medium">Analyzing your food...</p>
                        <p className="text-sm text-white/70 mt-1">Detecting items & estimating portions</p>
                      </div>
                    )}
                  </div>
                  {!isUploading && !isAnalyzing && (
                    <div className="flex gap-3 w-full max-w-sm">
                      <Button variant="outline" className="flex-1" onClick={handleRetakePhoto}>Retake</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── REVIEW MODE (NEW) ─── */}
          {entryMode === "review" && (
            <div className="space-y-5 flex-1 overflow-y-auto">

              {/* Photo thumbnail */}
              {photoPreview && (
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-black shrink-0 border border-purple-200">
                    <img src={photoPreview} alt="Meal" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">AI Detected Foods</p>
                    <p className="text-xs text-purple-600 mt-0.5">Review and edit before calculating nutrition</p>
                  </div>
                </div>
              )}

              {/* Meal Type selector */}
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

              {/* Food items table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--color-neutral-800)]">Detected Foods</h3>
                  <span className="text-xs text-[var(--color-neutral-500)]">{reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""}</span>
                </div>

                {reviewItems.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-lg text-center">
                    No food items detected. Use <strong>+ Add Food</strong> below to add items manually.
                  </div>
                )}

                <div className="space-y-2">
                  {reviewItems.map(item => (
                    <div key={item.id} className="bg-white border border-[var(--color-neutral-200)] rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        {/* Food name */}
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full rounded-md border border-[var(--color-neutral-200)] px-2.5 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                            value={item.name}
                            onChange={e => handleReviewItemChange(item.id, "name", e.target.value)}
                          />
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteReviewItem(item.id)}
                          className="text-red-400 hover:text-red-600 p-1 shrink-0"
                          title="Remove item"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>

                      {/* Quantity + Unit row */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="w-full rounded-md border border-[var(--color-neutral-200)] px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                            value={item.quantity || ""}
                            onChange={e => handleReviewItemChange(item.id, "quantity", e.target.value)}
                            placeholder="Qty"
                          />
                        </div>
                        <select
                          className="rounded-md border border-[var(--color-neutral-200)] px-2 py-1.5 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none bg-white"
                          value={item.unit}
                          onChange={e => handleReviewItemChange(item.id, "unit", e.target.value)}
                        >
                          {UNIT_OPTIONS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        {item.isEstimated && (
                          <Tooltip content="Quantity estimated by AI from photo">
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0 border-amber-200 shrink-0">
                              ≈ est.
                            </Badge>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Food section */}
              {!isAddingFood ? (
                <button
                  onClick={() => setIsAddingFood(true)}
                  className="w-full py-2.5 border-2 border-dashed border-[var(--color-neutral-300)] rounded-lg text-sm font-medium text-[var(--color-neutral-500)] hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-300)] hover:bg-[var(--color-primary-50)] transition-colors"
                >
                  + Add Food
                </button>
              ) : (
                <div className="bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] rounded-lg p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--color-neutral-700)]">Add a Food Item</h4>
                  <input
                    type="text"
                    className="w-full rounded-md border border-[var(--color-neutral-300)] px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                    placeholder="Food name (e.g. Paneer)"
                    value={newFoodName}
                    onChange={e => setNewFoodName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="flex-1 rounded-md border border-[var(--color-neutral-300)] px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none"
                      placeholder="Quantity"
                      value={newFoodQuantity}
                      onChange={e => setNewFoodQuantity(e.target.value)}
                    />
                    <select
                      className="rounded-md border border-[var(--color-neutral-300)] px-2 py-1.5 text-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none bg-white"
                      value={newFoodUnit}
                      onChange={e => setNewFoodUnit(e.target.value)}
                    >
                      {UNIT_OPTIONS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setIsAddingFood(false); setNewFoodName(""); setNewFoodQuantity(""); }}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" className="flex-1" onClick={handleAddReviewFood} disabled={!newFoodName.trim() || !newFoodQuantity || parseFloat(newFoodQuantity) <= 0}>
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Error */}
              {calcError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-md">
                  {calcError}
                </div>
              )}
            </div>
          )}

          {/* ─── RESULTS MODE (NEW) ─── */}
          {entryMode === "results" && (
            <div className="space-y-6 flex-1 overflow-y-auto">

              {/* Meal Type selector */}
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

              {/* Total Nutrition Summary Card */}
              <div className="bg-gradient-to-br from-[var(--color-primary-50)] to-purple-50 border border-[var(--color-primary-200)] rounded-xl p-5">
                <h3 className="font-bold text-[var(--color-primary-800)] mb-4">Total Nutrition</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[var(--color-neutral-900)]">{resultsTotals.calories}</p>
                    <p className="text-xs font-medium text-[var(--color-neutral-500)] mt-0.5">Calories (kcal)</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{resultsTotals.protein}g</p>
                    <p className="text-xs font-medium text-[var(--color-neutral-500)] mt-0.5">Protein</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{resultsTotals.carbs}g</p>
                    <p className="text-xs font-medium text-[var(--color-neutral-500)] mt-0.5">Carbohydrates</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{resultsTotals.fat}g</p>
                    <p className="text-xs font-medium text-[var(--color-neutral-500)] mt-0.5">Fat</p>
                  </div>
                </div>
                {(resultsTotals.fiber > 0 || resultsTotals.sugar > 0) && (
                  <div className="flex gap-4 mt-3 text-xs text-[var(--color-neutral-600)]">
                    {resultsTotals.fiber > 0 && <span>Fiber: <strong>{resultsTotals.fiber}g</strong></span>}
                    {resultsTotals.sugar > 0 && <span>Sugar: <strong>{resultsTotals.sugar}g</strong></span>}
                    {resultsTotals.sodium > 0 && <span>Sodium: <strong>{resultsTotals.sodium}mg</strong></span>}
                  </div>
                )}
              </div>

              {/* Per-item breakdown */}
              <div className="space-y-2">
                <h3 className="font-semibold text-[var(--color-neutral-800)]">Food Breakdown</h3>
                {calculatedItems.map((item, idx) => (
                  <div key={idx} className="bg-white border border-[var(--color-neutral-200)] rounded-lg p-3">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <p className="font-medium text-sm text-[var(--color-neutral-800)]">{item.name}</p>
                      <span className="text-xs text-[var(--color-neutral-500)]">{item.portionDescription}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-[var(--color-neutral-600)]">
                      <span><strong>{item.calories}</strong> kcal</span>
                      <span>P: <strong>{item.proteinGrams}g</strong></span>
                      <span>C: <strong>{item.carbGrams}g</strong></span>
                      <span>F: <strong>{item.fatGrams}g</strong></span>
                      {item.fiberGrams > 0 && <span>Fiber: <strong>{item.fiberGrams}g</strong></span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit button */}
              <button
                onClick={handleBackToReview}
                className="w-full text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] font-medium py-1"
              >
                ← Edit Foods & Recalculate
              </button>
            </div>
          )}

          {/* ─── MANUAL MODE (unchanged from original) ─── */}
          {entryMode === "manual" && (
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
                  We couldn&apos;t detect any food items in this photo. Please add them manually below.
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
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium p-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium p-2"
                      >
                        Remove
                      </button>
                    </div>
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
          {entryMode === "review" && (
            <>
              <Button variant="outline" onClick={() => setEntryMode("photo")} disabled={isCalculating}>
                ← Back
              </Button>
              <Button variant="outline" onClick={() => { setEntryMode("manual"); setIsAiAssisted(false) }} disabled={isCalculating}>
                Enter Manually Instead
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCalculateNutrition}
                disabled={reviewItems.length === 0 || isCalculating}
              >
                {isCalculating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating...
                  </span>
                ) : "Calculate Nutrition"}
              </Button>
            </>
          )}

          {entryMode === "results" && (
            <>
              <Button variant="outline" onClick={handleBackToReview} disabled={isPending}>
                ← Edit Foods
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveFromResults}
                disabled={isPending || calculatedItems.length === 0}
              >
                {isPending ? "Saving..." : "Save Meal"}
              </Button>
            </>
          )}

          {entryMode === "manual" && (
            <>
              <Button variant="outline" onClick={onClose} disabled={isPending || isUploading}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleSave} 
                disabled={(items.length === 0 && (!currentItem.name || currentItem.calories <= 0)) || isPending || isUploading}
              >
                {isPending ? "Saving..." : "Save Meal"}
              </Button>
            </>
          )}

          {(entryMode === "select" || entryMode === "photo") && (
            <Button variant="outline" onClick={onClose} disabled={isPending || isUploading || isAnalyzing}>Cancel</Button>
          )}
        </div>

      </div>
    </div>
  )
}
