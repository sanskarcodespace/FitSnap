import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"

const SPECIALTY_LABELS: Record<string, string> = {
  "YOGA": "Yoga",
  "FITNESS": "Fitness & Personal Training",
  "WEIGHT_LOSS": "Weight Loss",
  "WEIGHT_GAIN": "Weight Gain",
  "STRENGTH": "Strength & Muscle",
  "NUTRITION": "Nutrition Coaching",
  "WELLNESS": "Wellness & General Health"
}

export default async function CoachProfilePage() {
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

  const profile = user.coachProfile

  if (!profile.onboardingCompleted) {
    redirect("/coach/onboarding")
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-[var(--text-h2-size)] font-bold text-[var(--color-primary-950)]">Profile</h1>
        <Link href="/coach/profile/edit">
          <Button variant="secondary">Edit Profile</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Avatar 
                src={profile.profilePhoto || undefined} 
                initials={profile.businessName?.charAt(0).toUpperCase() || "C"} 
                size="lg" 
                className="mx-auto border-4 border-[var(--color-secondary-100)]"
              />
              <div>
                <h2 className="text-xl font-bold">{profile.businessName}</h2>
                <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mt-1">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[var(--color-neutral-500)]">Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.credentials ? (
                <p className="text-[var(--text-body-sm-size)]">{profile.credentials}</p>
              ) : (
                <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-400)] italic">Not added yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Specialties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map(spec => (
                  <Badge key={spec} variant="default">
                    {SPECIALTY_LABELS[spec] || spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Professional Bio</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.bio ? (
                <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-700)] whitespace-pre-line leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <div className="p-8 text-center bg-[var(--color-neutral-50)] rounded-lg border border-dashed border-[var(--color-neutral-300)]">
                  <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">No bio added yet.</p>
                  <Link href="/coach/profile/edit" className="text-[var(--color-primary-600)] text-[var(--text-body-sm-size)] font-medium hover:underline mt-2 inline-block">
                    Add your bio
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
