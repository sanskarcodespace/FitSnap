export function validateEnv() {
  if (process.env.NODE_ENV === "production") {
    const requiredVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ];

    const missingVars = requiredVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      console.error(
        `🚨 CRITICAL: Missing required production environment variables:\n` +
          missingVars.map((v) => `   - ${v}`).join("\n")
      );
      // Hard fail to prevent running in production without required secrets
      process.exit(1);
    }
    
    // Warn about missing non-critical variables
    if (!process.env.GEMINI_API_KEY && process.env.MOCK_AI !== "true") {
      console.warn("⚠️ WARNING: GEMINI_API_KEY is missing and MOCK_AI is not true. AI features will fail.");
    }
  }
}

// Call this immediately when imported
validateEnv();
