import prisma from "@/lib/db/prisma";

export type SubscriptionTier = 'SOLO' | 'GROWTH' | 'STUDIO';

// Simulating Stripe integration for billing logic
export async function getSubscriptionTier(coachId: string): Promise<SubscriptionTier> {
  // In a real app, query Stripe or a Subscription model.
  // We'll mock this for now. For testing, if coach's email has "growth", return GROWTH
  const coach = await prisma.user.findUnique({ where: { id: coachId } });
  if (coach?.email.includes('growth')) return 'GROWTH';
  if (coach?.email.includes('studio')) return 'STUDIO';
  return 'SOLO';
}

export async function canInviteMoreClients(coachId: string): Promise<boolean> {
  const tier = await getSubscriptionTier(coachId);
  
  if (tier === 'STUDIO') return true;

  const activeOrPendingCount = await prisma.coachClientConnection.count({
    where: {
      coachId,
      status: { in: ['ACTIVE', 'PENDING'] }
    }
  });

  if (tier === 'SOLO') {
    return activeOrPendingCount < 5;
  }
  
  if (tier === 'GROWTH') {
    return activeOrPendingCount < 25;
  }

  return false;
}
