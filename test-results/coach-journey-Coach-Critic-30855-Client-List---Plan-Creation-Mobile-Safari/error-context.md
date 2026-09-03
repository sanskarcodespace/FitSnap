# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: coach-journey.test.ts >> Coach Critical Journey >> Login -> Client List -> Plan Creation
- Location: tests/e2e/coach-journey.test.ts:16:7

# Error details

```
PrismaClientUnknownRequestError: 
Invalid `testPrisma.user.create()` invocation in
/Users/sanskar/FitSnap/FitSnap/tests/utils.ts:28:32

  25 }
  26 
  27 export async function createTestCoach(email: string) {
→ 28   return await testPrisma.user.create(
Error occurred during query execution:
ConnectorError(ConnectorError { user_facing_error: None, kind: QueryError(PostgresError { code: "40P01", message: "deadlock detected", severity: "ERROR", detail: Some("Process 10262 waits for RowExclusiveLock on relation 16996 of database 16971; blocked by process 10265.\nProcess 10265 waits for AccessExclusiveLock on relation 16986 of database 16971; blocked by process 10262."), column: None, hint: Some("See server log for query details.") }), transient: false })
```

# Test source

```ts
  1  | import { PrismaClient } from '@prisma/client';
  2  | import { signToken } from '@/lib/auth/jwt';
  3  | import bcrypt from "bcryptjs";
  4  | 
  5  | export const testPrisma = new PrismaClient();
  6  | 
  7  | export async function resetDatabase() {
  8  |   const tableNames = await testPrisma.$queryRaw<
  9  |     Array<{ tablename: string }>
  10 |   >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  11 | 
  12 |   const tables = tableNames
  13 |     .map(({ tablename }) => tablename)
  14 |     .filter((name) => name !== '_prisma_migrations')
  15 |     .map((name) => `"public"."${name}"`)
  16 |     .join(', ');
  17 | 
  18 |   try {
  19 |     if (tables) {
  20 |       await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  21 |     }
  22 |   } catch (error) {
  23 |     console.error({ error });
  24 |   }
  25 | }
  26 | 
  27 | export async function createTestCoach(email: string) {
> 28 |   return await testPrisma.user.create({
     |                                ^ PrismaClientUnknownRequestError: 
  29 |     data: {
  30 |       email,
  31 |       passwordHash: await bcrypt.hash('password123', 10),
  32 |       role: 'COACH',
  33 |       emailVerified: true,
  34 |       coachProfile: {
  35 |         create: {
  36 |           businessName: 'Test Coach Business',
  37 |           onboardingCompleted: true,
  38 |         },
  39 |       },
  40 |     },
  41 |   });
  42 | }
  43 | 
  44 | export async function createTestClient(email: string) {
  45 |   return await testPrisma.user.create({
  46 |     data: {
  47 |       email,
  48 |       passwordHash: await bcrypt.hash('password123', 10),
  49 |       role: 'CLIENT',
  50 |       emailVerified: true,
  51 |       clientProfile: {
  52 |         create: {
  53 |           onboardingCompleted: true,
  54 |         },
  55 |       },
  56 |     },
  57 |   });
  58 | }
  59 | 
  60 | export async function createActiveConnection(coachId: string, clientId: string) {
  61 |   return await testPrisma.coachClientConnection.create({
  62 |     data: {
  63 |       coachId,
  64 |       clientId,
  65 |       invitedEmail: 'test@example.com',
  66 |       invitationToken: 'token-' + Math.random().toString(),
  67 |       invitationTokenExpiry: new Date(Date.now() + 86400000),
  68 |       status: 'ACTIVE',
  69 |       acceptedAt: new Date(),
  70 |     },
  71 |   });
  72 | }
  73 | 
  74 | export async function createMockSessionToken(userId: string, role: 'COACH' | 'CLIENT', email: string) {
  75 |   return await signToken({ userId, role, email });
  76 | }
  77 | 
```