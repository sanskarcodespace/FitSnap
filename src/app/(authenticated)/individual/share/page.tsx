import { getClientReport } from "@/lib/data/client-report";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { IndividualShareClient } from "./IndividualShareClient";
import { Share2 } from "lucide-react";

export default async function ShareProgressPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const token = (await cookies()).get("session_token")?.value;
  if (!token) redirect("/login");
  
  const session = await verifyToken(token);
  if (!session || session.role !== "INDIVIDUAL") redirect("/login");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const d30 = new Date(today);
  d30.setDate(d30.getDate() - 29);
  const start30Str = d30.toISOString().split("T")[0];

  const start = typeof searchParams.start === "string" ? searchParams.start : start30Str;
  const end = typeof searchParams.end === "string" ? searchParams.end : todayStr;

  const periodMode = typeof searchParams.period === "string" ? searchParams.period : "30d";
  
  const report = await getClientReport(undefined, session.userId, start, end, periodMode);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-neutral-900)] flex items-center gap-2">
            <Share2 className="w-6 h-6 text-[var(--color-primary-600)]" />
            Share My Progress
          </h1>
          <p className="text-[var(--color-neutral-500)] mt-1">
            Generate a summary of your achievements and share it.
          </p>
        </div>
      </div>

      <IndividualShareClient 
        initialReport={report}
        initialStart={start}
        initialEnd={end}
        initialPeriodMode={periodMode}
      />
    </div>
  );
}
