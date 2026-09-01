import fs from "fs"
import path from "path"

export type EmailType = 
  | "VERIFY_EMAIL" 
  | "HABIT_REMINDER" 
  | "MONTHLY_REPORT_READY" 
  | "NEW_MESSAGE"

interface SendEmailArgs {
  to: string
  subject: string
  type: EmailType
  body: string
}

export async function sendEmail({ to, subject, type, body }: SendEmailArgs) {
  const emailLog = {
    id: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
    to,
    subject,
    type,
    body,
  }

  if (process.env.NODE_ENV !== "production") {
    // In dev, append to a local JSON file for inspection
    const dataDir = path.join(process.cwd(), ".data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const emailFilePath = path.join(dataDir, "sent-emails.json")
    
    let emails = []
    if (fs.existsSync(emailFilePath)) {
      try {
        emails = JSON.parse(fs.readFileSync(emailFilePath, "utf8"))
      } catch (e) {
        emails = []
      }
    }

    emails.push(emailLog)
    fs.writeFileSync(emailFilePath, JSON.stringify(emails, null, 2))
    
    console.log(`[DEV EMAIL] Sent ${type} to ${to}: ${subject}`)
  } else {
    // In production, would integrate with SendGrid, Postmark, etc.
    console.log(`[PROD EMAIL] Sent ${type} to ${to}: ${subject}`)
  }
}
