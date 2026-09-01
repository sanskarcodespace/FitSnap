"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { sendEmail } from "@/lib/email"

export async function getConversation(connectionId: string) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Unauthorized")
  const session = await verifyToken(token)
  if (!session) throw new Error("Unauthorized")

  // Verify connection belongs to user and is ACTIVE
  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId }
  })
  
  if (!connection) throw new Error("Connection not found")
  if (connection.status !== "ACTIVE") throw new Error("Connection is not active")
  if (connection.coachId !== session.userId && connection.clientId !== session.userId) {
    throw new Error("Unauthorized")
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: { coachClientConnectionId: connectionId }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        coachClientConnectionId: connectionId,
        status: "ACTIVE"
      }
    })
  }

  return conversation
}

export async function getMessages(conversationId: string) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Unauthorized")
  const session = await verifyToken(token)
  if (!session) throw new Error("Unauthorized")

  // Verify conversation belongs to a connection the user is part of and is active
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { connection: true }
  })

  if (!conversation || conversation.status !== "ACTIVE" || conversation.connection.status !== "ACTIVE") {
    throw new Error("Conversation not available")
  }

  if (conversation.connection.coachId !== session.userId && conversation.connection.clientId !== session.userId) {
    throw new Error("Unauthorized")
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" }
  })

  return messages
}

export async function sendMessage(conversationId: string, body: string) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Unauthorized")
  const session = await verifyToken(token)
  if (!session) throw new Error("Unauthorized")

  // Verify conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { connection: true }
  })

  if (!conversation || conversation.status !== "ACTIVE" || conversation.connection.status !== "ACTIVE") {
    throw new Error("Conversation not available")
  }

  if (conversation.connection.coachId !== session.userId && conversation.connection.clientId !== session.userId) {
    throw new Error("Unauthorized")
  }

  if (!body.trim()) {
    throw new Error("Message cannot be empty")
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.userId,
      body: body.trim()
    }
  })

  // Update conversation updatedAt
  const now = new Date()
  let updateData: any = { updatedAt: now }

  // Check email cooldown
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000)
  if (!conversation.lastMessageEmailSentAt || conversation.lastMessageEmailSentAt < thirtyMinsAgo) {
    // Determine recipient
    const recipientId = session.userId === conversation.connection.coachId ? conversation.connection.clientId : conversation.connection.coachId
    
    // Fetch recipient user and profile to check preference
    if (!recipientId) return;

    const recipientUser = await prisma.user.findUnique({
      where: { id: recipientId as string },
      include: {
        clientProfile: true,
        coachProfile: true
      }
    })

    if (recipientUser) {
      const emailEnabled = recipientUser.clientProfile?.emailOnNewMessage ?? recipientUser.coachProfile?.emailOnNewMessage ?? true
      
      if (emailEnabled) {
        // Send email
        const senderRole = session.userId === conversation.connection.coachId ? "Your coach" : "Your client"
        await sendEmail({
          to: recipientUser.email,
          subject: "New Message on FitSnap",
          type: "NEW_MESSAGE",
          body: `${senderRole} sent you a new message. Log in to view and reply.`
        })
        // Update the timestamp
        updateData.lastMessageEmailSentAt = now
      }
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: updateData
  })

  return message
}

export async function markMessagesAsRead(conversationId: string) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return false
  const session = await verifyToken(token)
  if (!session) return false

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.userId },
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  })

  return true
}

export async function getUnreadCount() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return 0
  const session = await verifyToken(token)
  if (!session) return 0

  const count = await prisma.message.count({
    where: {
      senderId: { not: session.userId },
      readAt: null,
      conversation: {
        status: "ACTIVE",
        connection: {
          status: "ACTIVE",
          OR: [
            { coachId: session.userId },
            { clientId: session.userId }
          ]
        }
      }
    }
  })

  return count
}
