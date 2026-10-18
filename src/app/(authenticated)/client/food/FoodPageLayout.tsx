"use client"

import React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FoodLogClient } from "./FoodLogClient"
import dynamic from "next/dynamic"
const FoodHistoryTab = dynamic(() => import("./FoodHistoryTab").then(module => module.FoodHistoryTab), { loading: () => <p role="status" className="p-6 text-sm">Loading your history…</p> })
import type { NutritionSummary } from "@/lib/data/nutrition"

export function FoodPageLayout({ date, summary, basePath = "/client" }: { date: string, summary: NutritionSummary, basePath?: string }) {
  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-2 space-y-6">
      <div>
        <h1 className="text-[length:var(--text-h2-size)] font-bold text-[var(--color-primary-800)]">
          Your food journal
        </h1>
        <p className="text-[length:var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">
          A clearer picture of your plate. A little more intention in your day.
        </p>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-6">
          <FoodLogClient date={date} summary={summary} hideHeader basePath={basePath} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <FoodHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
