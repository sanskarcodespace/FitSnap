"use server"

import prisma from "@/lib/db/prisma"

export async function submitContactForm(formData: FormData) {
  try {
    // 1. Check Honeypot
    const honeypot = formData.get("website_url") // Hidden field name
    if (honeypot) {
      // If honeypot is filled, it's likely a bot. Silently reject.
      return { success: false, error: "Spam detected." }
    }

    // 2. Extract Fields
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const context = formData.get("context") as string
    const message = formData.get("message") as string

    // 3. Validate Required Fields
    if (!name || !email || !message) {
      return { success: false, error: "Name, email, and message are required." }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address." }
    }

    // Length constraints
    if (message.length > 2000) {
      return { success: false, error: "Message is too long." }
    }

    // 4. Save to Database
    await prisma.contactInquiry.create({
      data: {
        name,
        email,
        context: context || null,
        message,
        status: "new"
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error submitting contact form:", error)
    return { success: false, error: "Failed to submit. Please try again later." }
  }
}
