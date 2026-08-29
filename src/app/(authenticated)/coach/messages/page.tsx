import { EmptyState } from "@/components/ui/states"
import { MessageCircle } from "lucide-react"

export default function CoachMessagesPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-950)]">Messages</h1>
      <EmptyState 
        icon={<MessageCircle className="w-12 h-12 text-[var(--color-neutral-400)]" />} 
        title="Messaging coming soon" 
        description="Soon you'll be able to chat with all your clients directly from here." 
      />
    </div>
  )
}
