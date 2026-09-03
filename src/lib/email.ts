import fs from "fs"
import path from "path"
import nodemailer from "nodemailer"

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

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.example.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }
  return transporter;
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

  const emailDriver = process.env.EMAIL_DRIVER || "log"

  if (emailDriver === "smtp") {
    try {
      const mailer = getTransporter();
      await mailer.sendMail({
        from: process.env.EMAIL_FROM || "hello@fitsnap.com",
        to,
        subject,
        html: body,
      });
      console.log(`[PROD EMAIL] Sent ${type} to ${to}: ${subject}`);
    } catch (error) {
      console.error("[PROD EMAIL ERROR] Failed to send email via SMTP:", error);
      // Depending on strictness, we might want to throw here, but logging is safer to prevent crashing on minor email failures
    }
  } else {
    // Local JSON log fallback
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
  }
}
