"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"

export async function getNotifications() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return []
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") return []

  const notifications = await prisma.notification.findMany({
    where: { clientId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20
  })

  return notifications
}

export async function markNotificationsAsRead(ids: string[]) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return { success: false }
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") return { success: false }

  if (ids.length === 0) return { success: true }

  await prisma.notification.updateMany({
    where: { 
      id: { in: ids },
      clientId: session.userId,
      readAt: null
    },
    data: { readAt: new Date() }
  })

  return { success: true }
}
