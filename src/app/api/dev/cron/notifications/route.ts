import { NextResponse } from "next/server"
import prisma from "@/lib/db/prisma"
import { sendEmail } from "@/lib/email"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  const simulatedDateParam = searchParams.get("simulatedDate")

  if (!clientId || !simulatedDateParam) {
    return NextResponse.json({ error: "Missing clientId or simulatedDate" }, { status: 400 })
  }

  // Simulated date e.g. "2026-08-31T15:00:00Z"
  const now = new Date(simulatedDateParam)
  
  const client = await prisma.user.findUnique({
    where: { id: clientId, role: "CLIENT" },
    include: { clientProfile: true }
  })

  if (!client || !client.clientProfile) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  const profile = client.clientProfile
  const results: any = { habitReminders: [], monthlyReports: [] }

  // 1. Habit Reminders
  if (profile.habitReminderEnabled && profile.habitReminderHour !== null) {
    // Basic TZ shift
    const clientHour = getHourInTimezone(now, profile.timezone)
    const clientDateString = getDateStringInTimezone(now, profile.timezone)

    if (clientHour >= profile.habitReminderHour && profile.lastHabitReminderSentDate !== clientDateString) {
      // Check for incomplete active habits today
      const connection = await prisma.coachClientConnection.findFirst({
        where: { clientId: client.id, status: "ACTIVE" }
      })
      
      let incompleteCount = 0
      if (connection) {
        const activePlans = await prisma.habitPlan.findMany({
          where: { coachClientConnectionId: connection.id, status: "ACTIVE" },
          include: { items: { where: { status: "active" } } }
        })

        for (const plan of activePlans) {
          for (const item of plan.items) {
            const completion = await prisma.habitCompletion.findFirst({
              where: { habitPlanItemId: item.id, clientId: client.id, date: clientDateString }
            })
            if (!completion) incompleteCount++
          }
        }
      }

      if (incompleteCount > 0) {
        // Send Reminder
        const message = `You have ${incompleteCount} incomplete habit(s) today. Don't forget to log them!`
        await prisma.notification.create({
          data: {
            clientId: client.id,
            type: "HABIT_REMINDER",
            message
          }
        })
        await sendEmail({
          to: client.email,
          subject: "Your Daily Habit Reminder",
          type: "HABIT_REMINDER",
          body: message
        })

        await prisma.clientProfile.update({
          where: { id: profile.id },
          data: { lastHabitReminderSentDate: clientDateString }
        })
        results.habitReminders.push({ sent: true, clientDateString })
      }
    }
  }

  // 2. Monthly Report Notification
  if (profile.monthlyReportNotificationEnabled) {
    const clientDate = getDateInTimezone(now, profile.timezone)
    // Send on the 2nd of the month for the previous month
    if (clientDate.getDate() === 2) {
      const prevMonthDate = new Date(clientDate)
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
      const targetMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`

      if (profile.lastMonthlyReportNotifiedMonth !== targetMonth) {
        const message = `Your report for ${targetMonth} is ready.`
        await prisma.notification.create({
          data: {
            clientId: client.id,
            type: "MONTHLY_REPORT_READY",
            message,
            relatedMonth: targetMonth
          }
        })
        await sendEmail({
          to: client.email,
          subject: "Your Monthly Progress Report is Ready",
          type: "MONTHLY_REPORT_READY",
          body: message
        })

        await prisma.clientProfile.update({
          where: { id: profile.id },
          data: { lastMonthlyReportNotifiedMonth: targetMonth }
        })
        results.monthlyReports.push({ sent: true, targetMonth })
      }
    }
  }

  return NextResponse.json({ success: true, results })
}

// Helpers
function getHourInTimezone(date: Date, tz: string) {
  const str = date.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false })
  return parseInt(str, 10)
}

function getDateStringInTimezone(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date)
  const y = parts.find(p => p.type === "year")?.value
  const m = parts.find(p => p.type === "month")?.value
  const d = parts.find(p => p.type === "day")?.value
  return `${y}-${m}-${d}`
}

function getDateInTimezone(date: Date, tz: string) {
  const ds = getDateStringInTimezone(date, tz)
  return new Date(`${ds}T00:00:00Z`)
}
