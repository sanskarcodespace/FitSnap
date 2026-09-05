import prisma from "./src/lib/db/prisma"

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: "test-" + Date.now() + "@test.com",
        passwordHash: "test",
        role: "INDIVIDUAL"
      }
    })
    console.log("Success", user)
  } catch (e) {
    console.error("Error creating user:", e)
  }
}
main()
