import { EmptyState } from "@/components/ui/states"

export default function ClientPlanPage() {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto py-8">
      <div className="pb-6">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Plan
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Your daily schedule of workouts, yoga sessions, and meals.
        </p>
      </div>

      <EmptyState
        title="Planning Features Coming Soon"
        description="Soon you will be able to see structured schedules assigned by your coach and check off activities as you complete them."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
        }
        className="flex-1 border-0 bg-white shadow-sm"
      />
    </div>
  )
}
