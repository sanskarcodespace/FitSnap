"use client"

import { Button } from "@/components/ui/button"

export function PrintReportButton() {
  return (
    <Button onClick={() => window.print()} variant="secondary" size="sm">
      Print This Report
    </Button>
  )
}
