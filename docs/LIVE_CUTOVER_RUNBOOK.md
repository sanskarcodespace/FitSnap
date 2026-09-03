# Live Credential Cutover Runbook

This document details the exact steps required by a business owner to transition the staging/pre-production environment to full live production, activating real money movement and production AI billing.

**PREREQUISITES**
- Access to the domain registrar (e.g., Namecheap, Route53, GoDaddy)
- Access to the production hosting provider environment (e.g., Vercel, Render)
- Admin access to Stripe Dashboard
- Admin access to Google Cloud Console (for Gemini API)
- Admin access to AWS Console (for S3 storage)
- Admin access to Email Provider (e.g., Postmark, SendGrid)

## Step 1: Stripe Live Cutover
1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle "Test mode" to **OFF** in the top right corner.
3. Navigate to **Developers -> API keys**.
4. Reveal and copy the **Live Secret Key** (starts with `sk_live_`).
5. Paste this into your production host's environment variables as `STRIPE_SECRET_KEY`.
6. Reveal and copy the **Live Publishable Key** (starts with `pk_live_`).
7. Paste this into your production host's environment variables as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
8. Navigate to **Developers -> Webhooks**.
9. Click "Add endpoint" and enter your production URL: `https://app.fitsnap.com/api/webhooks/stripe`.
10. Select the event: `checkout.session.completed`.
11. Add the endpoint, then click "Reveal" under **Signing secret** (starts with `whsec_`).
12. Paste this into your production host's environment variables as `STRIPE_WEBHOOK_SECRET`.

## Step 2: Gemini API Live Cutover
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API key associated with your production Google Cloud project (which must have billing enabled).
3. Paste this key into your production host's environment variables as `GEMINI_API_KEY`.
4. Ensure `MOCK_AI` is set to `"false"` in production.

## Step 3: Domain and DNS Cutover
1. In your hosting provider (e.g., Vercel), add your custom domain (e.g., `app.fitsnap.com`).
2. The host will provide CNAME or A records.
3. Go to your domain registrar's DNS settings and add those records.
4. Update `NEXT_PUBLIC_APP_URL` in your production environment variables to match your new `https://` custom domain.

## Step 4: Storage & Email
1. Verify `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_S3_BUCKET_NAME` are correctly set for the live bucket.
2. Ensure the bucket does **not** have public read access by default (our code handles ACLs per-object).
3. Verify `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` and `EMAIL_FROM` are set for the live email provider.
4. Ensure `STORAGE_DRIVER="s3"` and `EMAIL_DRIVER="smtp"`.

## Step 5: Verification
1. Deploy the application with all environment variables.
2. Load the production site.
3. Perform a live signup test.
4. Execute a $1 live subscription test (you can refund it in Stripe immediately).
5. Upload a photo and verify it saves to S3 and AI analysis runs.
