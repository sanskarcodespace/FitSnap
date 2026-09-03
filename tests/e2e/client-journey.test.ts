import { test, expect } from '@playwright/test';
import { testPrisma, createTestCoach, createTestClient, createActiveConnection, resetDatabase } from '../utils';

test.describe('Client Critical Journey', () => {
  let coach: any;
  let client: any;

  test.beforeAll(async () => {
    await resetDatabase();
    coach = await createTestCoach('e2ecoach2@test.com');
    client = await createTestClient('e2eclient2@test.com');
    await createActiveConnection(coach.id, client.id);
  });

  test.afterAll(async () => {
    await testPrisma.$disconnect();
  });

  test('Login -> Profile Setup -> Daily Logging', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2eclient2@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Since profile setup is true (onboardingCompleted: true in createTestClient), it skips to dashboard
    await expect(page).toHaveURL('/client');
    
    // 2. View Daily Check-in or Log
    await page.click('text=Log Meal');
    
    // Verify it navigates to food logging
    await expect(page).toHaveURL(/\/client\/food/);
    
    // Check if UI is rendered
    await expect(page.locator('text=Log Food')).toBeVisible();
    
    // 3. Weight log check
    await page.goto('/client');
    await page.click('text=Check In');
    await expect(page).toHaveURL(/\/client\/checkins/);
    
    await expect(page.locator('text=Daily Check-in')).toBeVisible();
  });
});
