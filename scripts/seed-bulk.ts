import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV !== "development") {
    console.error("This script can only be run in development mode.")
    process.exit(1)
  }

  console.log("Starting bulk seed...")

  // Create a coach
  const coachEmail = "bulkcoach@example.com"
  
  let coachUser = await prisma.user.findUnique({ where: { email: coachEmail } })
  if (!coachUser) {
    const passwordHash = await bcrypt.hash("password", 10)
    coachUser = await prisma.user.create({
      data: {
        email: coachEmail,
        passwordHash,
        role: "COACH",
        emailVerified: true,
        coachProfile: {
          create: {
            businessName: "Bulk Test Coach",
            onboardingCompleted: true
          }
        }
      }
    })
    console.log("Created bulk coach:", coachEmail)
  } else {
    console.log("Coach already exists, proceeding...")
  }

  // Create 30 active clients for this coach
  for (let i = 1; i <= 30; i++) {
    const clientEmail = `bulkclient${i}@example.com`
    let clientUser = await prisma.user.findUnique({ where: { email: clientEmail } })
    
    if (!clientUser) {
      const passwordHash = await bcrypt.hash("password", 10)
      clientUser = await prisma.user.create({
        data: {
          email: clientEmail,
          passwordHash,
          role: "CLIENT",
          emailVerified: true,
          clientProfile: {
            create: {
              goal: "Weight Loss",
              currentWeight: 80 + i,
              targetWeight: 75,
              onboardingCompleted: true
            }
          }
        }
      })
      
      // Connection
      const connection = await prisma.coachClientConnection.create({
        data: {
          coachId: coachUser.id,
          clientId: clientUser.id,
          invitedEmail: clientEmail,
          invitedName: `Bulk Client ${i}`,
          invitationToken: `token-bulk-${i}`,
          invitationTokenExpiry: new Date(Date.now() + 86400000),
          status: "ACTIVE",
          acceptedAt: new Date()
        }
      })

      // Generate 30 days of data for the client
      const today = new Date()
      for (let d = 0; d < 30; d++) {
        const dateObj = new Date(today)
        dateObj.setDate(today.getDate() - d)
        const dateStr = dateObj.toISOString().split('T')[0]

        // Only add data on some days to vary signals
        if (d % 2 === 0 || d % 3 === 0) {
          await prisma.mealLog.create({
            data: {
              clientId: clientUser.id,
              date: dateStr,
              mealType: "Breakfast",
              foodItems: {
                create: [{ name: "Eggs", calories: 200, proteinGrams: 15 }]
              }
            }
          })
          
          if (d % 3 === 0) {
             await prisma.workoutLog.create({
               data: {
                 clientId: clientUser.id,
                 date: dateStr,
                 title: "Morning Run",
                 category: "Cardio",
                 durationMinutes: 30
               }
             })
          }
        }
      }
      console.log(`Created client ${i}/30: ${clientEmail}`)
    }
  }

  console.log("Bulk seed complete!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
