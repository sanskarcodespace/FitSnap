"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FoodLogClient } from "./FoodLogClient"
import { FoodHistoryTab } from "./FoodHistoryTab"
import type { NutritionSummary } from "@/lib/data/nutrition"

export function FoodPageLayout({ date, summary }: { date: string, summary: NutritionSummary }) {
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Food & Nutrition
        </h1>
        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          Track what you eat and see your macro breakdown.
        </p>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-6">
          <FoodLogClient date={date} summary={summary} hideHeader />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <FoodHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
