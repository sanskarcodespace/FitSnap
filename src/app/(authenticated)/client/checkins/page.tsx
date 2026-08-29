import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";
import { ClientCheckinsView } from "./ClientCheckinsView";

export default async function ClientCheckinsPage() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) redirect("/login");
  
  const session = await verifyToken(token);
  if (!session?.userId) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId }
  });

  if (!profile) redirect("/client/onboarding");

  return (
    <div className="max-w-md mx-auto w-full pb-20 md:pb-0">
      <div className="p-4 bg-white border-b border-[var(--color-neutral-200)] sticky top-16 z-10">
        <h1 className="text-xl font-bold text-[var(--color-neutral-800)]">Daily Check-ins</h1>
        <p className="text-sm text-[var(--color-neutral-500)]">Track your sleep, steps, mood, and energy.</p>
      </div>
      
      <div className="p-4">
        <ClientCheckinsView clientId={session.userId} />
      </div>
    </div>
  );
}
