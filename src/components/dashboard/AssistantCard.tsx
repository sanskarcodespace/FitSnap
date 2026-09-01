import * as React from "react"
import Link from "next/link"
import { Sparkles, MessageCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function AssistantCard() {
  return (
    <Card className="shadow-sm border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)] transition-colors">
      <Link href="/client/assistant" className="block focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] rounded-lg">
        <CardHeader className="pb-3 border-b border-[var(--color-neutral-100)]">
          <CardTitle className="text-sm font-medium text-[var(--color-neutral-900)] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary-600)]" />
              Nutrition Assistant
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-[var(--color-neutral-600)] mb-3">
            Have a question about your nutrition or diet plan? Ask the assistant.
          </p>
          <div className="flex items-center text-sm font-medium text-[var(--color-primary-600)] gap-1">
            <MessageCircle className="w-4 h-4" />
            Open Assistant
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
