# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: coach-journey.test.ts >> Coach Critical Journey >> Login -> Client List -> Plan Creation
- Location: tests/e2e/coach-journey.test.ts:16:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/coach\/clients/
Received string:  "http://localhost:3001/coach"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:3001/coach"

```

```yaml
- alert: Welcome, Test Coach Business
- link "Skip to main content":
  - /url: "#main-content"
- link "FitSnap Coach":
  - /url: /coach
- button
- main:
  - heading "Welcome, Test Coach Business" [level=1]
  - paragraph: You have 0 active clients and 0 pending invitations.
  - heading "Client Roster" [level=2]
  - button "Invite a Client"
  - textbox "Search by name or email..."
  - combobox:
    - option "All Statuses" [selected]
    - option "Active"
    - option "Profile Setup Pending"
    - option "Inactive 7+ Days"
    - option "Inactive 14+ Days"
  - combobox:
    - option "All Clients" [selected]
    - option "Needs Attention Only"
  - combobox:
    - option "All Goals" [selected]
    - option "Weight Loss"
    - option "Weight Gain"
    - option "Maintenance"
    - option "Strength & Muscle"
    - option "Yoga Improvement"
    - option "General Health"
  - combobox:
    - option "Most Recent" [selected]
    - option "Needs Attention First"
    - option "Name (A-Z)"
    - option "Goal"
    - option "Last Active (Most Recent)"
    - option "Last Active (Least Recent)"
  - heading "Active Clients" [level=3]
  - paragraph: No active clients yet.
  - button "Invite your first client"
  - heading "Pending Invitations" [level=3]
  - paragraph: No pending invitations.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { testPrisma, createTestCoach, createTestClient, createActiveConnection, resetDatabase } from '../utils';
  3  | 
  4  | test.describe('Coach Critical Journey', () => {
  5  |   let coach: any;
  6  | 
  7  |   test.beforeAll(async () => {
  8  |     await resetDatabase();
  9  |     coach = await createTestCoach('e2ecoach@test.com');
  10 |   });
  11 | 
  12 |   test.afterAll(async () => {
  13 |     await testPrisma.$disconnect();
  14 |   });
  15 | 
  16 |   test('Login -> Client List -> Plan Creation', async ({ page }) => {
  17 |     // 1. Login
  18 |     await page.goto('/login');
  19 |     await page.fill('input[name="email"]', 'e2ecoach@test.com');
  20 |     await page.fill('input[name="password"]', 'password123');
  21 |     await page.click('button[type="submit"]');
  22 | 
  23 |     // Should redirect to dashboard
  24 |     await expect(page).toHaveURL('/coach');
  25 |     
  26 |     // 2. View Clients
  27 |     await page.click('text=Clients');
> 28 |     await expect(page).toHaveURL(/\/coach\/clients/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  29 | 
  30 |     // Wait, the client doesn't exist yet for the UI test unless we seed one or invite one.
  31 |     // Let's seed a client connection
  32 |     const client = await createTestClient('e2eclient@test.com');
  33 |     await createActiveConnection(coach.id, client.id);
  34 | 
  35 |     // Reload to see the client
  36 |     await page.reload();
  37 |     
  38 |     // Should see the client email or name (assuming profile name is set, but email works)
  39 |     await expect(page.locator(`text=${client.email}`).first()).toBeVisible();
  40 | 
  41 |     // Click on client
  42 |     await page.click(`text=${client.email}`);
  43 |     await expect(page).toHaveURL(new RegExp(`/coach/clients/${client.id}$|/coach/clients/.*`));
  44 |     
  45 |     // 3. Plan Creation
  46 |     // Go to Diet Plan
  47 |     await page.click('text=Diet Plan');
  48 |     // We should be on plan creation / view page
  49 |     
  50 |     // This is a minimal E2E test, just proving the paths work and the app doesn't crash
  51 |     await expect(page.locator('text=Diet Plan')).toBeVisible();
  52 |   });
  53 | });
  54 | 
```