import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { EditProfileForm } from "./edit-profile-form"

export default async function EditProfilePage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { coachProfile: true }
  })

  if (!user || !user.coachProfile) {
    redirect("/coach/onboarding")
  }

  return (
    <div className="py-8">
      <EditProfileForm initialData={user.coachProfile} />
    </div>
  )
}
