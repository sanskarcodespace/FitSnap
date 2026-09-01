"use server"

import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { getDailyNutritionSummary } from "@/lib/data/nutrition"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({});

export async function getOrCreateAIConversation() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Unauthorized")
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") throw new Error("Unauthorized")

  let conversation = await prisma.aIConversation.findUnique({
    where: { clientId: session.userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  })

  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: {
        clientId: session.userId,
      },
      include: {
        messages: true
      }
    })
  }

  return conversation
}

export async function sendMessageToAssistant(text: string) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Unauthorized")
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") throw new Error("Unauthorized")

  const trimmed = text.trim()
  if (!trimmed) {
    return { success: false, error: "Message cannot be empty." }
  }
  if (trimmed.length > 1000) {
    return { success: false, error: "Message is too long (max 1000 characters)." }
  }

  // 1. Rate limiting (30 messages per hour per client)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentMessagesCount = await prisma.aIMessage.count({
    where: {
      conversation: { clientId: session.userId },
      sender: "CLIENT",
      createdAt: { gte: oneHourAgo }
    }
  })

  if (recentMessagesCount >= 30) {
    return { success: false, error: "You've reached the maximum number of assistant messages for this hour. Please try again later." }
  }

  // 2. Fetch context
  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.userId },
    select: { goal: true }
  })
  
  const todayStr = new Date().toISOString().split('T')[0]
  const nutritionSummary = await getDailyNutritionSummary(session.userId, todayStr)
  
  // Find active coach connection
  const activeConnection = await prisma.coachClientConnection.findFirst({
    where: {
      client: { id: session.userId },
      status: "ACTIVE"
    }
  })

  let dietPlan = null
  if (activeConnection) {
    dietPlan = await prisma.dietPlan.findFirst({
      where: {
        coachClientConnectionId: activeConnection.id,
        status: "ACTIVE"
      },
      include: {
        mealGuidance: true,
        guidelines: true
      }
    })
  }

  // 3. Save the client message first
  const conversation = await getOrCreateAIConversation()
  
  const clientMessage = await prisma.aIMessage.create({
    data: {
      aiConversationId: conversation.id,
      sender: "CLIENT",
      body: trimmed
    }
  })

  // 4. Build prompt and context block
  const contextBlock = `
TODAY'S NUTRITION (${todayStr}):
Consumed Calories: ${nutritionSummary.consumedTotals.calories} kcal
Target Calories: ${nutritionSummary.targets?.calories || "Not set"}

Consumed Protein: ${nutritionSummary.consumedTotals.protein} g
Target Protein: ${nutritionSummary.targets?.protein || "Not set"}

Consumed Carbs: ${nutritionSummary.consumedTotals.carbs} g
Target Carbs: ${nutritionSummary.targets?.carbs || "Not set"}

Consumed Fat: ${nutritionSummary.consumedTotals.fat} g
Target Fat: ${nutritionSummary.targets?.fat || "Not set"}

CLIENT GOAL: ${profile?.goal || "Not set"}

ACTIVE DIET PLAN:
${dietPlan ? `Overview: ${dietPlan.overview || "None"}
Meal Guidance: ${dietPlan.mealGuidance?.map(g => `${g.mealType}: ${g.guidanceText}`).join(', ') || "None"}
Guidelines: ${dietPlan.guidelines?.map(g => g.text).join(', ') || "None"}` : "No active diet plan."}
`

  const systemPrompt = `
You are a highly capable AI nutrition assistant inside a coaching app.
Your task is to answer the client's nutrition or diet plan questions based ON THEIR ACTUAL DATA below.

${contextBlock}

CRITICAL RULES AND SAFETY GUARDRAILS:
1. Ground every response in the supplied context block. When the context indicates no target is currently set or no diet plan currently exists, say so plainly rather than inventing either.
2. Stay within practical, general nutrition information: food and portion suggestions, macro/calorie math, and general facts about food groups and nutrients. 
3. NEVER diagnose a medical condition, never recommend medication or supplements for treating a condition, and never give guidance tailored to a specific diagnosed medical condition (e.g., diabetes, kidney disease). You have no access to a client's medical history. Redirect these to their coach or a healthcare professional.
4. NEVER override or contradict the coach's assigned targets or plan. If a client asks you to bless eating significantly under their target, or to help minimize or obscure what they're logging, DO NOT COMPLY. Decline to provide a number that undercuts the coach's guidance, and suggest raising the change directly with their coach.
5. If a client's questions suggest they want guidance on eating unsafely little, express distress about food or body image, or describe a pattern like skipping meals to "make room" for something else, DO NOT provide specific low-calorie targets or restriction advice. Respond with care, avoid dwelling on or escalating the topic, and suggest talking with their coach or a healthcare professional.
6. Always be clear it is a supportive, informational tool — never a medical authority and never a substitute for the client's coach.
7. Keep responses concise, practical, and conversational. Do not format as a long article. Use plain readable text without markdown links. Do not generate clickable UI links.
`

  // Fetch recent messages for history
  const recentHistory = await prisma.aIMessage.findMany({
    where: { aiConversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 20 // Window size
  })
  
  const historyParts = recentHistory.reverse().map(msg => ({
    role: msg.sender === "CLIENT" ? "user" : "model",
    parts: [{ text: msg.body }]
  }))
  
  // Actually, we don't need to append the current clientMessage to historyParts if we send it as the current message, 
  // but wait, historyParts now includes clientMessage because we just saved it.
  // We can pop the last message from historyParts and use it as the new prompt.
  const currentMsgPart = historyParts.pop()!

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      const chatSession = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: [
          ...historyParts,
          currentMsgPart
        ],
        config: {
          systemInstruction: systemPrompt
        }
      })
      response = chatSession.text
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response) {
      throw new Error("Empty response from AI")
    }

    // Save AI response
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        aiConversationId: conversation.id,
        sender: "ASSISTANT",
        body: response
      }
    })

    return { 
      success: true, 
      clientMessage,
      assistantMessage
    }

  } catch (error: any) {
    console.error("AI Assistant error:", error)
    return { success: false, error: "Sorry, I'm having trouble responding right now — please try again in a moment", clientMessage }
  }
}
