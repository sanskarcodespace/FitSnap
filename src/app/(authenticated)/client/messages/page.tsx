import { EmptyState } from "@/components/ui/states"
import { Button } from "@/components/ui/button"

export default function ClientMessagesPage() {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto py-8">
      <div className="pb-6">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Messages
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Chat with your coach and share updates.
        </p>
      </div>

      <EmptyState
        title="Messaging Coming Soon"
        description="Direct chat with your coach is coming soon. In the meantime, you can reach out to them via their connected email."
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        }
        action={<Button disabled>New Message</Button>}
        className="flex-1 border-0 bg-white shadow-sm"
      />
    </div>
  )
}
