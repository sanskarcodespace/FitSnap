import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  const status = {
    app: 'ok',
    database: 'unknown',
    timestamp: new Date().toISOString(),
  };

  try {
    // Perform a simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'connected';
  } catch (error) {
    status.database = 'unreachable';
    // Do not leak error details or connection strings in the response
  }

  return NextResponse.json(status, {
    status: status.database === 'connected' ? 200 : 503,
  });
}
