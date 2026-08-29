import { WorkoutPlan, WorkoutPlanSession, WorkoutPlanExercise, WorkoutPlanGuideline } from "@prisma/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type WorkoutPlanSessionWithExercises = WorkoutPlanSession & {
  exercises: WorkoutPlanExercise[];
};

export type WorkoutPlanWithDetails = WorkoutPlan & {
  sessions: WorkoutPlanSessionWithExercises[];
  guidelines: WorkoutPlanGuideline[];
};

export function WorkoutPlanView({ plan }: { plan: WorkoutPlanWithDetails }) {
  // Sort sessions by sortOrder
  const sortedSessions = [...plan.sessions].sort((a, b) => a.sortOrder - b.sortOrder);

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

      {sortedSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">Workout Sessions</h3>
          <div className="grid gap-6">
            {sortedSessions.map((session) => {
              const sortedExercises = [...session.exercises].sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <Card key={session.id} className="border border-[var(--color-neutral-200)] shadow-sm">
                  <CardHeader className="pb-3 border-b border-[var(--color-neutral-100)]">
                    <CardTitle className="text-xl font-bold text-[var(--color-neutral-900)]">
                      {session.name}
                    </CardTitle>
                    {session.description && (
                      <p className="text-sm text-[var(--color-neutral-600)] whitespace-pre-wrap mt-1">
                        {session.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    {sortedExercises.length > 0 ? (
                      <div className="space-y-4">
                        {sortedExercises.map((exercise, index) => (
                          <div key={exercise.id} className="pb-4 last:pb-0 border-b last:border-0 border-[var(--color-neutral-100)]">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                              <h4 className="font-semibold text-[var(--color-neutral-900)] flex gap-2">
                                <span className="text-[var(--color-neutral-400)]">{index + 1}.</span> 
                                {exercise.name}
                              </h4>
                              {exercise.setsRepsDescription && (
                                <Badge variant="secondary" className="w-fit bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-100)] whitespace-nowrap">
                                  {exercise.setsRepsDescription}
                                </Badge>
                              )}
                            </div>
                            {exercise.notes && (
                              <p className="text-sm text-[var(--color-neutral-600)] whitespace-pre-wrap mt-2 ml-5">
                                {exercise.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-neutral-500)] italic">No exercises added.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
