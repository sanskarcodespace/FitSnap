// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testPrisma, createTestCoach, createTestClient, createActiveConnection, resetDatabase } from '../utils';
import { getClientAttentionFlags } from '@/lib/data/attention-flags';
import { vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'test-token' }))
  }))
}));

vi.mock('@/lib/auth/jwt', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    verifyToken: vi.fn().mockResolvedValue({ userId: 'test-user', role: 'COACH' })
  };
});

describe('Block 23: 8 Attention-Flag Threshold Rules (Boundaries)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it('generates REDUCED_ENGAGEMENT if no activity logged since onboarding', async () => {
    const coach = await createTestCoach('coach_flags1@test.com');
    const client = await createTestClient('client_flags1@test.com');
    const connection = await createActiveConnection(coach.id, client.id);

    // No activity logged
    const flags = await getClientAttentionFlags(coach.id, client.id);
    expect(flags).toContainEqual(expect.objectContaining({ type: 'REDUCED_ENGAGEMENT' }));
  });
});

import { getClientReport } from '@/lib/data/client-report';

describe('Block 25: Calendar-month comparison truncation', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('truncates previous month exactly to the same number of days elapsed in current month', async () => {
    const coach = await createTestCoach('coach_report@test.com');
    const client = await createTestClient('client_report@test.com');
    await createActiveConnection(coach.id, client.id);

    // E.g. Current period is 2023-09-01 to 2023-09-15 (15 days)
    // Prev period should be 2023-08-01 to 2023-08-15
    const report = await getClientReport(coach.id, client.id, '2023-09-01', '2023-09-15', 'month');
    
    expect(report.period.start).toBe('2023-09-01');
    expect(report.period.end).toBe('2023-09-15');
    
    expect(report.prevPeriod.start).toBe('2023-08-01');
    expect(report.prevPeriod.end).toBe('2023-08-15');
  });

  it('caps at end of previous month if current month days exceed previous month total days', async () => {
    const coach = await createTestCoach('coach_report2@test.com');
    const client = await createTestClient('client_report2@test.com');
    await createActiveConnection(coach.id, client.id);

    // E.g. March 1 - 31 (31 days)
    // Prev month is Feb. Feb has 28 days. 
    const report = await getClientReport(coach.id, client.id, '2023-03-01', '2023-03-31', 'month');
    
    expect(report.prevPeriod.start).toBe('2023-02-01');
    // We expect the truncation to happen at the end of Feb
    expect(report.prevPeriod.end).toMatch(/^2023-02-2[78]$/);
  });
});

