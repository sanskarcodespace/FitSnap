import { DietPlan, DietPlanMealGuidance, DietPlanGuideline } from "@prisma/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type DietPlanWithDetails = DietPlan & {
  mealGuidance: DietPlanMealGuidance[];
  guidelines: DietPlanGuideline[];
};

export function DietPlanView({ plan }: { plan: DietPlanWithDetails }) {
  const mealOrder = ["Breakfast", "Lunch", "Dinner", "Snack"];
  
  // Sort meal guidance according to typical order
  const sortedMeals = [...plan.mealGuidance].sort((a, b) => {
    const idxA = mealOrder.indexOf(a.mealType);
    const idxB = mealOrder.indexOf(b.mealType);
    // If not in the predefined list, put at the end
    const finalIdxA = idxA === -1 ? 99 : idxA;
    const finalIdxB = idxB === -1 ? 99 : idxB;
    return finalIdxA - finalIdxB;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-[var(--color-neutral-900)]">{plan.title}</h2>
          {plan.status === "ARCHIVED" && (
            <Badge variant="secondary" className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] border-[var(--color-neutral-200)]">
              Archived {plan.archivedAt ? new Date(plan.archivedAt).toLocaleDateString() : ""}
            </Badge>
          )}
        </div>
        {plan.overview && (
          <p className="text-[var(--text-body-size)] text-[var(--color-neutral-700)] whitespace-pre-wrap mt-2">
            {plan.overview}
          </p>
        )}
      </div>

      {sortedMeals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">Meal Guidance</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sortedMeals.map((meal) => (
              <Card key={meal.id} className="border border-[var(--color-neutral-200)] shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-[var(--color-primary-600)] font-bold">{meal.mealType}</span>
                    </CardTitle>
                  </div>
                  {meal.customLabel && (
                    <p className="text-sm font-medium text-[var(--color-neutral-500)]">{meal.customLabel}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-700)] whitespace-pre-wrap">
                    {meal.guidanceText}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {plan.guidelines.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">Guidelines</h3>
          <Card className="border border-[var(--color-neutral-200)] shadow-sm">
            <CardContent className="pt-6">
              <ul className="space-y-3 list-disc list-outside ml-5 text-[var(--text-body-size)] text-[var(--color-neutral-700)]">
                {plan.guidelines.map((guideline) => (
                  <li key={guideline.id} className="pl-1 leading-relaxed">
                    {guideline.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
