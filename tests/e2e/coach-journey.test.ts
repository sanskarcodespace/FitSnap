import { test, expect } from '@playwright/test';
import { testPrisma, createTestCoach, createTestClient, createActiveConnection, resetDatabase } from '../utils';

test.describe('Coach Critical Journey', () => {
  let coach: any;

  test.beforeAll(async () => {
    await resetDatabase();
    coach = await createTestCoach('e2ecoach@test.com');
  });

  test.afterAll(async () => {
    await testPrisma.$disconnect();
  });

  test('Login -> Client List -> Plan Creation', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2ecoach@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/coach');
    
    // 2. View Clients
    await page.click('text=Clients');
    await expect(page).toHaveURL(/\/coach\/clients/);

    // Wait, the client doesn't exist yet for the UI test unless we seed one or invite one.
    // Let's seed a client connection
    const client = await createTestClient('e2eclient@test.com');
    await createActiveConnection(coach.id, client.id);

    // Reload to see the client
    await page.reload();
    
    // Should see the client email or name (assuming profile name is set, but email works)
    await expect(page.locator(`text=${client.email}`).first()).toBeVisible();

    // Click on client
    await page.click(`text=${client.email}`);
    await expect(page).toHaveURL(new RegExp(`/coach/clients/${client.id}$|/coach/clients/.*`));
    
    // 3. Plan Creation
    // Go to Diet Plan
    await page.click('text=Diet Plan');
    // We should be on plan creation / view page
    
    // This is a minimal E2E test, just proving the paths work and the app doesn't crash
    await expect(page.locator('text=Diet Plan')).toBeVisible();
  });
});
