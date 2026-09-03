# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: client-journey.test.ts >> Client Critical Journey >> Login -> Profile Setup -> Daily Logging
- Location: tests/e2e/client-journey.test.ts:19:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Log Meal')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { testPrisma, createTestCoach, createTestClient, createActiveConnection, resetDatabase } from '../utils';
  3  | 
  4  | test.describe('Client Critical Journey', () => {
  5  |   let coach: any;
  6  |   let client: any;
  7  | 
  8  |   test.beforeAll(async () => {
  9  |     await resetDatabase();
  10 |     coach = await createTestCoach('e2ecoach2@test.com');
  11 |     client = await createTestClient('e2eclient2@test.com');
  12 |     await createActiveConnection(coach.id, client.id);
  13 |   });
  14 | 
  15 |   test.afterAll(async () => {
  16 |     await testPrisma.$disconnect();
  17 |   });
  18 | 
  19 |   test('Login -> Profile Setup -> Daily Logging', async ({ page }) => {
  20 |     // 1. Login
  21 |     await page.goto('/login');
  22 |     await page.fill('input[name="email"]', 'e2eclient2@test.com');
  23 |     await page.fill('input[name="password"]', 'password123');
  24 |     await page.click('button[type="submit"]');
  25 | 
  26 |     // Since profile setup is true (onboardingCompleted: true in createTestClient), it skips to dashboard
  27 |     await expect(page).toHaveURL('/client');
  28 |     
  29 |     // 2. View Daily Check-in or Log
> 30 |     await page.click('text=Log Meal');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  31 |     
  32 |     // Verify it navigates to food logging
  33 |     await expect(page).toHaveURL(/\/client\/food/);
  34 |     
  35 |     // Check if UI is rendered
  36 |     await expect(page.locator('text=Log Food')).toBeVisible();
  37 |     
  38 |     // 3. Weight log check
  39 |     await page.goto('/client');
  40 |     await page.click('text=Check In');
  41 |     await expect(page).toHaveURL(/\/client\/checkins/);
  42 |     
  43 |     await expect(page.locator('text=Daily Check-in')).toBeVisible();
  44 |   });
  45 | });
  46 | 
```