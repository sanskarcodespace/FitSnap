"use client"

import * as React from "react"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, UserPlus, User, Users, ArrowLeft, Check } from "lucide-react"
import { signup } from "./actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Role = "INDIVIDUAL" | "COACH"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setError("")
  }

  const handleContinue = () => {
    if (!selectedRole) {
      setError("Please select an account type.")
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRole) {
      setError("Please select an account type.")
      setStep(1)
      return
    }
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.set("role", selectedRole)

    try {
      const result = await signup(formData)
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      } else if (result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (err: any) {
      setError("An unexpected error occurred.")
      setIsPending(false)
    }
  }

  return (
    <MarketingLayout>
      <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden px-4 py-20">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-secondary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '5s' }} />

        <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-75">
          <div className="bg-white/80 backdrop-blur-xl border border-[var(--color-neutral-200)] shadow-2xl rounded-3xl p-8 space-y-8">
            
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-50)] mx-auto flex items-center justify-center mb-4">
                    <UserPlus className="w-6 h-6 text-[var(--color-primary-600)]" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--color-neutral-900)]">Join FitSnap</h1>
                  <p className="text-[var(--color-neutral-600)]">How would you like to use FitSnap?</p>
                </div>

                <div className="grid gap-4">
                  {/* Individual Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("INDIVIDUAL")}
                    className={`group relative w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 ${
                      selectedRole === "INDIVIDUAL" 
                        ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] shadow-md" 
                        : "border-[var(--color-neutral-200)] bg-white/60 backdrop-blur-sm hover:border-[var(--color-primary-400)] hover:bg-[var(--color-primary-50)]/50 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-200)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <User className="w-6 h-6 text-[var(--color-primary-700)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-1">I'm an Individual</h3>
                        <p className="text-sm text-[var(--color-neutral-600)] leading-relaxed">
                          Track your own food, nutrition, fitness and progress.
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 transition-colors shrink-0 mt-1 flex items-center justify-center ${
                        selectedRole === "INDIVIDUAL"
                          ? "border-[var(--color-primary-500)]"
                          : "border-[var(--color-neutral-300)] group-hover:border-[var(--color-primary-500)]"
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)] transition-opacity ${
                          selectedRole === "INDIVIDUAL" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`} />
                      </div>
                    </div>
                  </button>

                  {/* Coach Card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect("COACH")}
                    className={`group relative w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-500)] focus:ring-offset-2 ${
                      selectedRole === "COACH" 
                        ? "border-[var(--color-secondary-500)] bg-[var(--color-secondary-50)] shadow-md" 
                        : "border-[var(--color-neutral-200)] bg-white/60 backdrop-blur-sm hover:border-[var(--color-secondary-400)] hover:bg-[var(--color-secondary-50)]/50 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-secondary-100)] to-[var(--color-secondary-200)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-[var(--color-secondary-700)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--color-neutral-900)] mb-1">I'm a Coach</h3>
                        <p className="text-sm text-[var(--color-neutral-600)] leading-relaxed">
                          Manage clients, send invitations and monitor their progress.
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 transition-colors shrink-0 mt-1 flex items-center justify-center ${
                        selectedRole === "COACH"
                          ? "border-[var(--color-secondary-500)]"
                          : "border-[var(--color-neutral-300)] group-hover:border-[var(--color-secondary-500)]"
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-[var(--color-secondary-500)] transition-opacity ${
                          selectedRole === "COACH" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`} />
                      </div>
                    </div>
                  </button>
                </div>

                <Button 
                  onClick={handleContinue}
                  className="w-full h-12 text-base rounded-xl shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 mt-2" 
                  size="lg"
                  disabled={!selectedRole}
                >
                  Continue
                </Button>

                {error && (
                  <Alert variant="error" title="Error" className="bg-[var(--color-error-bg)]/50 backdrop-blur-sm mt-4">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </Alert>
                )}

                <p className="text-center text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] pt-2">
                  Already have an account? <Link href="/login" className="text-[var(--color-primary-600)] font-semibold hover:underline">Log in</Link>
                </p>
              </>
            )}

            {/* Step 2: Credentials Form */}
            {step === 2 && selectedRole && (
              <>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError("") }}
                    className="flex items-center gap-1.5 text-sm text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] transition-colors focus:outline-none focus:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change account type
                  </button>
                  
                  <div className="text-center space-y-2">
                    <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${
                      selectedRole === "INDIVIDUAL" 
                        ? "bg-[var(--color-primary-50)]" 
                        : "bg-[var(--color-secondary-50)]"
                    }`}>
                      {selectedRole === "INDIVIDUAL" 
                        ? <User className="w-6 h-6 text-[var(--color-primary-600)]" />
                        : <Users className="w-6 h-6 text-[var(--color-secondary-600)]" />
                      }
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--color-neutral-900)]">Create your account</h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-neutral-100)] text-sm text-[var(--color-neutral-700)]">
                      <Check className="w-3.5 h-3.5" />
                      {selectedRole === "INDIVIDUAL" ? "Individual Account" : "Coach Account"}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="error" title="Signup Failed" className="bg-[var(--color-error-bg)]/50 backdrop-blur-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </Alert>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[var(--color-neutral-700)]">Email Address</Label>
                    <Input id="email" name="email" type="email" required className="bg-white/50 focus:bg-white transition-colors" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[var(--color-neutral-700)]">Password</Label>
                    <Input id="password" name="password" type="password" required minLength={8} className="bg-white/50 focus:bg-white transition-colors" />
                  </div>

                  <input type="hidden" name="role" value={selectedRole} />

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base rounded-xl shadow-lg shadow-[var(--color-primary-500)]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300" 
                    size="lg" 
                    isLoading={isPending}
                  >
                    {selectedRole === "INDIVIDUAL" ? "Start Tracking" : "Sign Up as Coach"}
                  </Button>

                  <p className="text-center text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] pt-2">
                    Already have an account? <Link href="/login" className="text-[var(--color-primary-600)] font-semibold hover:underline">Log in</Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
