import { signToken } from "./src/lib/auth/jwt"

async function main() {
  try {
    const token = await signToken({ userId: "cmtoodnik0000q6slfuwohpp5", role: "INDIVIDUAL" })
    console.log("Success", token)
  } catch (e) {
    console.error("Error creating token:", e)
  }
}
main()
