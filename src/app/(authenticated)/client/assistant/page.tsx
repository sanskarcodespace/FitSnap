import React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { getOrCreateAIConversation } from "./actions"
import { AssistantClient } from "./AssistantClient"

export default async function AssistantPage() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) redirect("/login")

  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") redirect("/coach")

  const conversation = await getOrCreateAIConversation()

  return (
    <div className="py-6">
      <AssistantClient initialConversation={conversation} />
    </div>
  )
}
