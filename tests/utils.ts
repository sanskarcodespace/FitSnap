import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from "bcryptjs";

export const testPrisma = new PrismaClient();

export async function resetDatabase() {
  const tableNames = await testPrisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tableNames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    if (tables) {
      await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (error) {
    console.error({ error });
  }
}

export async function createTestCoach(email: string) {
  return await testPrisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'COACH',
      emailVerified: true,
      coachProfile: {
        create: {
          businessName: 'Test Coach Business',
          onboardingCompleted: true,
        },
      },
    },
  });
}

export async function createTestClient(email: string) {
  return await testPrisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'CLIENT',
      emailVerified: true,
      clientProfile: {
        create: {
          onboardingCompleted: true,
        },
      },
    },
  });
}

export async function createActiveConnection(coachId: string, clientId: string) {
  return await testPrisma.coachClientConnection.create({
    data: {
      coachId,
      clientId,
      invitedEmail: 'test@example.com',
      invitationToken: 'token-' + Math.random().toString(),
      invitationTokenExpiry: new Date(Date.now() + 86400000),
      status: 'ACTIVE',
      acceptedAt: new Date(),
    },
  });
}

export async function createMockSessionToken(userId: string, role: 'COACH' | 'CLIENT', email: string) {
  return await signToken({ userId, role });
}
