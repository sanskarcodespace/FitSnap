"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getThumbnailUrl } from "@/lib/utils"
import { Tooltip } from "@/components/ui/tooltip"
import { ProgressRing, ProgressBar } from "@/components/ui/progress"
import type { NutritionSummary } from "@/lib/data/nutrition"

type DailyFoodLogViewProps = {
  summary: NutritionSummary;
  readOnly?: boolean;
  onDeleteMeal?: (mealId: string) => void;
  onEditMeal?: (mealId: string) => void;
  onAddWater?: (amountMl: number) => void;
  onUndoWater?: () => void;
  coachConnectionId?: string; // If provided, adds a 'Message about this' link for the coach
  date?: string; // Optional date for the summary
  isPending?: boolean;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"]

export function DailyFoodLogView({
  summary,
  readOnly = false,
  onDeleteMeal,
  onEditMeal,
  onAddWater,
  onUndoWater,
  isPending = false,
  coachConnectionId,
  date
}: DailyFoodLogViewProps) {
  
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)

  const meals = summary.meals;
  const waterEntries = summary.waterEntries;

  // Group meals by type
  const mealsByType = MEAL_TYPES.map(type => {
    const mealLogsForType = meals.filter(m => m.mealType === type)
    return {
      type,
      logs: mealLogsForType
    }
  }).filter(group => !readOnly || group.logs.length > 0) // Hide empty sections in read-only mode

  return (
    <div className="space-y-6">
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl w-full h-full flex flex-col items-center justify-center pointer-events-none">
            <button 
              className="absolute top-4 right-4 text-white hover:text-[var(--color-neutral-300)] p-2 pointer-events-auto"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Meal Full Size" 
              className="max-w-full max-h-[85vh] object-contain pointer-events-auto rounded-lg"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Today's Nutrition / Totals */}
      {summary.hasTarget ? (
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)]">
          <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)] mb-4">Today's Nutrition</h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
            {/* Calories Ring */}
            <div className="flex flex-col items-center justify-center min-w-[200px]">
              <ProgressRing 
                value={summary.consumedTotals.calories} 
                max={summary.targets!.calories} 
                size={160}
                strokeWidth={12}
                indicatorColor="text-[var(--color-macro-calories)]"
              />
              <div className="mt-4 text-center">
                <p className="font-bold text-2xl font-tabular text-[var(--color-neutral-800)]">
                  {summary.consumedTotals.calories} <span className="text-lg font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.calories} kcal</span>
                </p>
                <p className="text-sm text-[var(--color-neutral-500)] font-medium">Calories</p>
              </div>
            </div>
            
            {/* Macro Bars */}
            <div className="flex-1 w-full space-y-6 flex flex-col justify-center">
              {/* Protein */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-medium text-sm text-[var(--color-neutral-700)]">Protein</span>
                  <span className="text-sm font-bold font-tabular text-[var(--color-neutral-800)]">
                    {summary.consumedTotals.protein} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.protein} g</span>
                  </span>
                </div>
                <ProgressBar 
                  value={summary.consumedTotals.protein} 
                  max={summary.targets!.protein} 
                  indicatorColor="bg-[var(--color-macro-protein)]" 
                />
              </div>
              
              {/* Carbs */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-medium text-sm text-[var(--color-neutral-700)]">Carbohydrates</span>
                  <span className="text-sm font-bold font-tabular text-[var(--color-neutral-800)]">
                    {summary.consumedTotals.carbs} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.carbs} g</span>
                  </span>
                </div>
                <ProgressBar 
                  value={summary.consumedTotals.carbs} 
                  max={summary.targets!.carbs} 
                  indicatorColor="bg-[var(--color-macro-carbs)]" 
                />
              </div>

              {/* Fat */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-medium text-sm text-[var(--color-neutral-700)]">Fat</span>
                  <span className="text-sm font-bold font-tabular text-[var(--color-neutral-800)]">
                    {summary.consumedTotals.fat} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.fat} g</span>
                  </span>
                </div>
                <ProgressBar 
                  value={summary.consumedTotals.fat} 
                  max={summary.targets!.fat} 
                  indicatorColor="bg-[var(--color-macro-fat)]" 
                />
              </div>

              {/* Water */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-medium text-sm text-[var(--color-neutral-700)]">Water</span>
                  <span className="text-sm font-bold font-tabular text-[var(--color-neutral-800)]">
                    {(summary.consumedTotals.waterMl / 1000).toFixed(1)} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.waterLiters.toFixed(1)} L</span>
                  </span>
                </div>
                <ProgressBar 
                  value={summary.consumedTotals.waterMl / 1000} 
                  max={summary.targets!.waterLiters} 
                  indicatorColor="bg-[var(--color-macro-water)]" 
                />
              </div>

              {/* Fiber (if target exists) */}
              {summary.targets!.fiber !== null && summary.targets!.fiber !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="font-medium text-sm text-[var(--color-neutral-700)]">Fiber</span>
                    <span className="text-sm font-bold font-tabular text-[var(--color-neutral-800)]">
                      {summary.consumedTotals.fiber} <span className="font-normal text-[var(--color-neutral-500)]">/ {summary.targets!.fiber} g</span>
                    </span>
                  </div>
                  <ProgressBar 
                    value={summary.consumedTotals.fiber} 
                    max={summary.targets!.fiber} 
                    indicatorColor="bg-[var(--color-neutral-600)]" 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-center border-t border-[var(--color-neutral-100)] pt-5">
            <a 
              href="/client/assistant" 
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] rounded px-2 py-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
              Ask the Nutrition Assistant
            </a>
          </div>
          
          {/* Additional Details */}
          <details className="mt-6 group border border-[var(--color-neutral-200)] rounded-lg">
            <summary className="cursor-pointer font-medium text-sm text-[var(--color-neutral-700)] bg-[var(--color-neutral-50)] px-4 py-3 rounded-lg group-open:rounded-b-none group-open:border-b border-[var(--color-neutral-200)] flex justify-between items-center hover:bg-[var(--color-neutral-100)] transition-colors">
              Additional Details
              <span className="text-[var(--color-neutral-400)] transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="p-4 bg-white rounded-b-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-[var(--color-neutral-50)] p-3 rounded border border-[var(--color-neutral-100)]">
                  <p className="text-xs text-[var(--color-neutral-500)] mb-1">Sugar</p>
                  <p className="font-semibold">{summary.consumedTotals.sugar}g</p>
                </div>
                <div className="bg-[var(--color-neutral-50)] p-3 rounded border border-[var(--color-neutral-100)]">
                  <p className="text-xs text-[var(--color-neutral-500)] mb-1">Sodium</p>
                  <p className="font-semibold">{summary.consumedTotals.sodium}mg</p>
                </div>
                {(summary.targets!.fiber === null || summary.targets!.fiber === undefined) && (
                  <div className="bg-[var(--color-neutral-50)] p-3 rounded border border-[var(--color-neutral-100)]">
                    <p className="text-xs text-[var(--color-neutral-500)] mb-1">Fiber</p>
                    <p className="font-semibold">{summary.consumedTotals.fiber}g</p>
                  </div>
                )}
              </div>
            </div>
          </details>
        </section>
      ) : (
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
            <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">Totals</h2>
            {readOnly ? (
              <span className="text-sm text-[var(--color-neutral-500)] italic flex gap-1 items-center">
                No nutrition targets set for this client yet. 
                <a href="#nutrition" className="text-[var(--color-primary-600)] hover:underline not-italic font-medium">Set Targets</a>
              </span>
            ) : (
              <span className="text-sm text-[var(--color-neutral-500)] italic">
                {!summary.hasActiveConnection 
                  ? "You're not currently connected with a coach, so no nutrition targets are set \u2014 here are your logged totals for today." 
                  : "Your coach hasn't set nutrition targets yet \u2014 here are your logged totals for today."}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)]">
              <p className="text-xs text-[var(--color-neutral-500)] mb-1">Calories</p>
              <p className="font-bold text-lg">{summary.consumedTotals.calories}</p>
            </div>
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)]">
              <p className="text-xs text-[var(--color-neutral-500)] mb-1">Protein</p>
              <p className="font-bold text-lg">{summary.consumedTotals.protein}g</p>
            </div>
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)]">
              <p className="text-xs text-[var(--color-neutral-500)] mb-1">Carbs</p>
              <p className="font-bold text-lg">{summary.consumedTotals.carbs}g</p>
            </div>
            <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 border border-[var(--color-neutral-100)]">
              <p className="text-xs text-[var(--color-neutral-500)] mb-1">Fat</p>
              <p className="font-bold text-lg">{summary.consumedTotals.fat}g</p>
            </div>
          </div>
        </section>
      )}

      {/* Meals */}
      <section className="space-y-4">
        <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">Meals</h2>
        
        {mealsByType.length === 0 && readOnly && (
          <p className="text-sm text-[var(--color-neutral-500)] italic">No meals logged for this day.</p>
        )}

        {mealsByType.map((group) => {
          if (group.logs.length === 0 && !readOnly) {
            return (
              <div key={group.type} className="bg-white rounded-xl p-4 shadow-sm border border-[var(--color-neutral-200)] flex justify-between items-center">
                <h3 className="font-semibold text-[var(--color-neutral-700)]">{group.type}</h3>
                <span className="text-sm text-[var(--color-neutral-400)]">Empty</span>
              </div>
            )
          }

          return (
            <div key={group.type} className="space-y-3">
              {group.logs.map(meal => {
                const mealCals = meal.foodItems.reduce((s: number, i: any) => s + i.calories, 0)
                const mealPro = meal.foodItems.reduce((s: number, i: any) => s + i.proteinGrams, 0)
                const mealCarbs = meal.foodItems.reduce((s: number, i: any) => s + i.carbGrams, 0)
                const mealFat = meal.foodItems.reduce((s: number, i: any) => s + i.fatGrams, 0)

                return (
                  <div key={meal.id} className="bg-white rounded-xl shadow-sm border border-[var(--color-neutral-200)] overflow-hidden">
                    <div className="bg-[var(--color-neutral-50)] px-4 py-3 border-b border-[var(--color-neutral-200)] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--color-neutral-800)]">{meal.mealType}</h3>
                        {meal.source === "ai_assisted" && (
                          <Tooltip content="This meal was logged with AI assistance">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 border-purple-200">AI Assisted</Badge>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-[var(--color-neutral-600)]">{mealCals} kcal</span>
                        {!readOnly && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => onEditMeal?.(meal.id)}
                              disabled={isPending}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-7 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100"
                              onClick={() => onDeleteMeal?.(meal.id)}
                              disabled={isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                        {coachConnectionId && (
                          <a 
                            href={`/coach/messages?connectionId=${coachConnectionId}&text=${encodeURIComponent(`Regarding your ${meal.mealType} food log on ${date ? new Date(date).toLocaleDateString() : 'this day'}: `)}`}
                            className="text-xs text-[var(--color-primary-600)] hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                            Message about this
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="divide-y divide-[var(--color-neutral-100)]">
                      {meal.photoReference && (
                         <div className="p-3 bg-[var(--color-neutral-50)]/30">
                           <div 
                             className="w-16 h-16 rounded-md overflow-hidden bg-black border border-[var(--color-neutral-200)] cursor-pointer relative group"
                             onClick={() => setSelectedImage(meal.photoReference!)}
                           >
                             <img src={getThumbnailUrl(meal.photoReference)} loading="lazy" alt={`Photo of ${meal.mealType} logged on ${new Date(meal.date).toLocaleDateString()}`} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                             </div>
                           </div>
                         </div>
                      )}
                      {meal.foodItems.map((item: any) => (
                        <div key={item.id} className="p-4 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[var(--color-neutral-800)]">{item.name}</p>
                              {item.originType === "ai_detected" && (
                                <Tooltip content="Detected by AI">
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-medium">AI</span>
                                </Tooltip>
                              )}
                            </div>
                            {item.portionDescription && (
                              <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">{item.portionDescription}</p>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="font-medium text-[var(--color-neutral-700)]">{item.calories} kcal</p>
                            <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                              {item.proteinGrams}p · {item.carbGrams}c · {item.fatGrams}f
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-[var(--color-neutral-50)]/50 p-3 text-xs text-[var(--color-neutral-500)] flex justify-end gap-3 border-t border-[var(--color-neutral-100)]">
                        <span>Total: {mealPro}g P</span>
                        <span>{mealCarbs}g C</span>
                        <span>{mealFat}g F</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </section>

      {/* Water */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--color-neutral-200)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">Water</h2>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              Total today: <span className="font-bold text-[var(--color-primary-700)]">{summary.consumedTotals.waterMl} ml</span>
            </p>
          </div>
          
          {!readOnly && waterEntries.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onUndoWater?.()}
              disabled={isPending}
            >
              Undo Last
            </Button>
          )}
        </div>

        {!readOnly && (
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1 min-h-[44px] bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)]"
              onClick={() => onAddWater?.(250)}
              disabled={isPending}
            >
              + 250ml
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-100)]"
              onClick={() => onAddWater?.(500)}
              disabled={isPending}
            >
              + 500ml
            </Button>
          </div>
        )}
      </section>

    </div>
  )
}
