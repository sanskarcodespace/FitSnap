import { getClientReport } from "@/lib/data/client-report";
import { PeriodSelector } from "@/components/ui/period-selector";
import { PrintReportButton } from "./PrintReportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Minus, FileText, CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function DeltaIndicator({ current, prev, invert = false }: { current: number; prev: number | null, invert?: boolean }) {
  if (prev === null) return <span className="text-[var(--color-neutral-400)] text-sm ml-2">-</span>;
  const diff = current - prev;
  if (diff === 0) return <span className="text-[var(--color-neutral-500)] text-sm ml-2 flex items-center"><Minus className="w-3 h-3 mr-1" /> 0</span>;

  let isPositiveDelta = diff > 0;
  let isGood = invert ? !isPositiveDelta : isPositiveDelta;

  return (
    <span className={`text-sm ml-2 flex items-center ${isGood ? 'text-[var(--color-success-600)]' : 'text-red-600'}`}>
      {isPositiveDelta ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
      {Math.abs(Number(diff.toFixed(1)))}
    </span>
  );
}

export default async function ClientReportPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const d30 = new Date(today);
  d30.setDate(d30.getDate() - 29);
  const start30Str = d30.toISOString().split("T")[0];

  const start = typeof searchParams.start === "string" ? searchParams.start : start30Str;
  const end = typeof searchParams.end === "string" ? searchParams.end : todayStr;

  // Placeholder coach ID, normally from auth session. 
  // We use connectionId to verify if needed, but getClientReport needs coachId.
  // We assume coachId is "coach1" for this mock SaaS platform, just like in other pages.
  // Wait, wait, let's get coachId from the page layout or hardcode "coach1" as per other blocks.
  const coachId = "coach1";
  
  const periodMode = typeof searchParams.period === "string" ? searchParams.period : "30d";
  const report = await getClientReport(coachId, params.id, start, end, periodMode);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[var(--color-primary-600)]" />
            Client Report
          </h1>
          <p className="text-[var(--color-neutral-500)]">
            Period: {new Date(start).toLocaleDateString()} – {new Date(end).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 items-center print:hidden">
          <PrintReportButton />
          <Button variant="outline" asChild>
            <Link href={`/coach/clients/${params.id}`}>Back to Client</Link>
          </Button>
        </div>
      </div>

      <PeriodSelector useUrlParams={true} defaultPeriod="30d" />

      <div className="space-y-6">
        {/* Goal Progress Section */}
        <Card>
          <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
            <CardTitle className="text-lg">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-600)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--color-neutral-900)]">Primary Goal: {report.goalProgress.goal}</p>
                <p className="text-[var(--color-neutral-600)] mt-1">{report.goalProgress.note}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        {report.metrics.nutrition && (
          <Card>
            <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                Nutrition & Water
                {!report.metrics.nutrition.hasPlan && <span className="text-xs font-normal bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">No Active Plan</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Avg Calories</div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold">{report.metrics.nutrition.cals.current}</span>
                    <DeltaIndicator current={report.metrics.nutrition.cals.current} prev={report.metrics.nutrition.cals.prev} />
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Avg Protein (g)</div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold">{report.metrics.nutrition.protein.current}</span>
                    <DeltaIndicator current={report.metrics.nutrition.protein.current} prev={report.metrics.nutrition.protein.prev} />
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Avg Carbs (g)</div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold">{report.metrics.nutrition.carbs.current}</span>
                    <DeltaIndicator current={report.metrics.nutrition.carbs.current} prev={report.metrics.nutrition.carbs.prev} />
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Avg Fat (g)</div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold">{report.metrics.nutrition.fat.current}</span>
                    <DeltaIndicator current={report.metrics.nutrition.fat.current} prev={report.metrics.nutrition.fat.prev} />
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Avg Water (L)</div>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold">{report.metrics.nutrition.water.current}</span>
                    <DeltaIndicator current={report.metrics.nutrition.water.current} prev={report.metrics.nutrition.water.prev} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workouts & Yoga */}
        {(report.metrics.workouts || report.metrics.yoga) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.metrics.workouts && (
              <Card>
                <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Workouts
                    {!report.metrics.workouts.hasPlan && <span className="text-xs font-normal bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">No Active Plan</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="text-sm text-neutral-500 mb-1">Sessions Logged</div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{report.metrics.workouts.count.current}</span>
                      <DeltaIndicator current={report.metrics.workouts.count.current} prev={report.metrics.workouts.count.prev} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {report.metrics.yoga && (
              <Card>
                <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Yoga
                    {!report.metrics.yoga.hasPlan && <span className="text-xs font-normal bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">No Active Plan</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="text-sm text-neutral-500 mb-1">Sessions Logged</div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">{report.metrics.yoga.count.current}</span>
                      <DeltaIndicator current={report.metrics.yoga.count.current} prev={report.metrics.yoga.count.prev} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Habits */}
        {report.metrics.habits && (
          <Card>
            <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
              <CardTitle className="text-lg">Habits</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {report.metrics.habits.items.map(habit => (
                  <div key={habit.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <span className="font-medium">{habit.name}</span>
                    <span className="text-sm font-bold bg-white px-3 py-1 border border-neutral-200 rounded-full text-[var(--color-neutral-700)]">
                      {habit.completed} / {habit.target} days
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check-ins & Measurements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.metrics.checkins && (
            <Card>
              <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
                <CardTitle className="text-lg">Check-ins & Sleep</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Avg Sleep (hrs)</div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{report.metrics.checkins.sleepHours.current !== null ? report.metrics.checkins.sleepHours.current : "-"}</span>
                    {report.metrics.checkins.sleepHours.current !== null && (
                      <DeltaIndicator current={report.metrics.checkins.sleepHours.current} prev={report.metrics.checkins.sleepHours.prev} />
                    )}
                  </div>
                </div>
                <div className="text-sm text-neutral-500">
                  Based on {report.metrics.checkins.count} check-ins this period.
                </div>
              </CardContent>
            </Card>
          )}

          {report.metrics.measurements && (
            <Card>
              <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
                <CardTitle className="text-lg">Weight Measurements</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-sm text-neutral-500 mb-1">Weight Change</div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">
                      {report.metrics.measurements.weightChange! > 0 ? "+" : ""}
                      {report.metrics.measurements.weightChange} kg
                    </span>
                  </div>
                </div>
                <div className="p-3 mt-3 bg-neutral-50 rounded-lg border border-neutral-100 flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Latest Weight</span>
                  <span className="font-semibold">{report.metrics.measurements.currentWeight} kg</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Photos */}
        {report.metrics.photos && (
          <Card>
            <CardHeader className="bg-[var(--color-neutral-50)] border-b border-[var(--color-neutral-200)] pb-4">
              <CardTitle className="text-lg">Progress Photos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex justify-between items-center">
              <p className="text-[var(--color-neutral-700)]">
                The client has logged <span className="font-bold">{report.metrics.photos.count}</span> progress photo {report.metrics.photos.count === 1 ? 'entry' : 'entries'} in this period.
              </p>
              <Link 
                href={`/coach/messages?connectionId=${params.id}&text=${encodeURIComponent(`Regarding your progress photos in the ${new Date(start).toLocaleDateString()} to ${new Date(end).toLocaleDateString()} report: `)}`}
                className="text-sm text-[var(--color-primary-600)] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Message about this
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
