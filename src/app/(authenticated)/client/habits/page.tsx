import { EmptyState } from "@/components/ui/states"

export default function ClientHabitsPage() {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto py-8">
      <div className="pb-6">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Habits
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Track daily routines like water intake and sleep.
        </p>
      </div>

      <EmptyState
        title="Habit Tracking Coming Soon"
        description="Daily habit formation and tracking features are currently under construction."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        }
        className="flex-1 border-0 bg-white shadow-sm"
      />
    </div>
  )
}
