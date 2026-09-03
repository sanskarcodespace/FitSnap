// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  testPrisma,
  createTestCoach,
  createTestClient,
  createActiveConnection
} from '../utils';
import { canInviteMoreClients, getSubscriptionTier } from '@/lib/billing';

describe('Block 30: Billing status computation', () => {
  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  describe('SOLO Plan', () => {
    it('limits to 5 clients', async () => {
      const coach = await createTestCoach('solo_coach@test.com');
      
      // Create 5 active clients
      for (let i = 0; i < 5; i++) {
        const client = await createTestClient(`client_solo_${i}@test.com`);
        await createActiveConnection(coach.id, client.id);
      }

      const canInvite = await canInviteMoreClients(coach.id);
      expect(canInvite).toBe(false);
    });

    it('allows if under 5 clients', async () => {
      const coach = await createTestCoach('solo_coach2@test.com');
      
      // Create 4 active clients
      for (let i = 0; i < 4; i++) {
        const client = await createTestClient(`client_solo2_${i}@test.com`);
        await createActiveConnection(coach.id, client.id);
      }

      const canInvite = await canInviteMoreClients(coach.id);
      expect(canInvite).toBe(true);
    });
  });

  describe('GROWTH Plan', () => {
    it('limits to 25 clients', async () => {
      const coach = await createTestCoach('growth_coach@test.com');
      
      // Create 25 active clients
      for (let i = 0; i < 25; i++) {
        const client = await createTestClient(`client_growth_${i}@test.com`);
        await createActiveConnection(coach.id, client.id);
      }

      const canInvite = await canInviteMoreClients(coach.id);
      expect(canInvite).toBe(false);
    });

    it('allows if under 25 clients', async () => {
      const coach = await createTestCoach('growth_coach2@test.com');
      
      // Create 24 active clients
      for (let i = 0; i < 24; i++) {
        const client = await createTestClient(`client_growth2_${i}@test.com`);
        await createActiveConnection(coach.id, client.id);
      }

      const canInvite = await canInviteMoreClients(coach.id);
      expect(canInvite).toBe(true);
    });
  });

  describe('STUDIO Plan', () => {
    it('allows unlimited clients', async () => {
      const coach = await createTestCoach('studio_coach@test.com');
      
      // Create 26 active clients
      for (let i = 0; i < 26; i++) {
        const client = await createTestClient(`client_studio_${i}@test.com`);
        await createActiveConnection(coach.id, client.id);
      }

      const canInvite = await canInviteMoreClients(coach.id);
      expect(canInvite).toBe(true);
    });
  });
});
