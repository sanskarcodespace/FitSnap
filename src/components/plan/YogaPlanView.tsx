import { YogaPlan, YogaPlanSequence, YogaPlanPose, YogaPlanGuideline } from "@prisma/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type YogaPlanSequenceWithPoses = YogaPlanSequence & {
  poses: YogaPlanPose[];
};

export type YogaPlanWithDetails = YogaPlan & {
  sequences: YogaPlanSequenceWithPoses[];
  guidelines: YogaPlanGuideline[];
};

export function YogaPlanView({ plan }: { plan: YogaPlanWithDetails }) {
  // Sort sequences by sortOrder
  const sortedSequences = [...plan.sequences].sort((a, b) => a.sortOrder - b.sortOrder);

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

      {sortedSequences.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[var(--color-neutral-900)]">Yoga Sequences</h3>
          <div className="grid gap-6">
            {sortedSequences.map((sequence) => {
              const sortedPoses = [...sequence.poses].sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <Card key={sequence.id} className="border border-[var(--color-neutral-200)] shadow-sm">
                  <CardHeader className="pb-3 border-b border-[var(--color-neutral-100)]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-[var(--color-neutral-900)]">
                          {sequence.name}
                        </CardTitle>
                        {sequence.description && (
                          <p className="text-sm text-[var(--color-neutral-600)] whitespace-pre-wrap">
                            {sequence.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sequence.style && (
                          <Badge variant="secondary" className="text-[var(--color-neutral-700)] border-[var(--color-neutral-300)]">
                            {sequence.style}
                          </Badge>
                        )}
                        {sequence.durationGuidance && (
                          <Badge variant="secondary" className="text-[var(--color-primary-700)] bg-[var(--color-primary-50)] border-[var(--color-primary-200)]">
                            {sequence.durationGuidance}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {sortedPoses.length > 0 ? (
                      <div className="space-y-4">
                        {sortedPoses.map((pose, index) => (
                          <div key={pose.id} className="pb-4 last:pb-0 border-b last:border-0 border-[var(--color-neutral-100)]">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                              <h4 className="font-semibold text-[var(--color-neutral-900)] flex gap-2">
                                <span className="text-[var(--color-neutral-400)]">{index + 1}.</span> 
                                {pose.name}
                              </h4>
                              {pose.holdOrRepGuidance && (
                                <Badge variant="secondary" className="w-fit bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-100)] whitespace-nowrap">
                                  {pose.holdOrRepGuidance}
                                </Badge>
                              )}
                            </div>
                            {pose.notes && (
                              <p className="text-sm text-[var(--color-neutral-600)] whitespace-pre-wrap mt-2 ml-5">
                                {pose.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--color-neutral-500)] italic">No poses added.</p>
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
