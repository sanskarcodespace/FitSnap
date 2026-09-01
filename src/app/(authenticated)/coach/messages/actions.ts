"use server"
import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"

export async function getInboxThreads() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return []
  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") return []

  const connections = await prisma.coachClientConnection.findMany({
    where: {
      coachId: session.userId,
      status: "ACTIVE"
    },
    include: {
      client: {
        include: { clientProfile: true }
      },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderId: { not: session.userId },
                  readAt: null
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      invitedAt: "desc"
    }
  })

  const threads = connections.map(c => {
    let name = c.invitedEmail
    if (c.invitedName) {
      name = c.invitedName
    }

    const lastMessage = c.conversation?.messages[0]
    
    return {
      connectionId: c.id,
      conversationId: c.conversation?.id,
      clientName: name,
      clientAvatar: c.client?.clientProfile?.profilePhoto || undefined,
      unreadCount: c.conversation?._count.messages || 0,
      lastMessageAt: lastMessage?.createdAt || c.invitedAt,
      lastMessageBody: lastMessage?.body || null,
      lastMessageSenderId: lastMessage?.senderId || null,
    }
  })

  threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
  
  return threads
}
