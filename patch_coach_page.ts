import fs from 'fs';
const path = 'src/app/(authenticated)/coach/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(
  'import { getClientActivitySignals } from "@/lib/data/activity-signals"\nimport { getClientAttentionFlags } from "@/lib/data/attention-flags"',
  `import { getBatchedActivityAndFlags } from "@/lib/data/batch-activity-signals"
import { getCachedRosterSignals, setCachedRosterSignals } from "@/lib/cache/roster-cache"`
);

// Replace active connections fetch
content = content.replace(
  `  const activeConnectionsRaw = await prisma.coachClientConnection.findMany({
    where: { 
      coachId: user.id, 
      status: "ACTIVE" 
    },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      }
    }
  })`,
  `  const pageStr = (searchParams.page as string) || "1"
  const page = parseInt(pageStr, 10) || 1
  const limit = 25
  const skip = (page - 1) * limit

  const activeConnectionsRaw = await prisma.coachClientConnection.findMany({
    where: { 
      coachId: user.id, 
      status: "ACTIVE" 
    },
    take: limit,
    skip: skip,
    orderBy: { createdAt: "desc" }, // Default stable sort
    include: {
      client: {
        include: {
          clientProfile: true
        }
      }
    }
  })`
);

// Replace signals fetching
content = content.replace(
  `  // Fetch signals for all active connections
  const activeConnectionsWithSignals = await Promise.all(
    activeConnectionsRaw.map(async (conn) => {
      if (!conn.clientId) return { ...conn, signals: null, attentionFlags: [] };
      try {
        const signals = await getClientActivitySignals(user.id, conn.clientId);
        const attentionFlags = await getClientAttentionFlags(user.id, conn.clientId);
        return { ...conn, signals, attentionFlags };
      } catch (err) {
        return { ...conn, signals: null, attentionFlags: [] };
      }
    })
  );`,
  `  // Fetch signals using batching and caching
  let cachedSignals = getCachedRosterSignals(user.id);
  const clientIdsToFetch = activeConnectionsRaw
    .map(c => c.clientId)
    .filter(Boolean) as string[];

  // Determine which client IDs we still need to fetch
  const missingClientIds = cachedSignals 
    ? clientIdsToFetch.filter(id => !cachedSignals!.has(id))
    : clientIdsToFetch;

  if (missingClientIds.length > 0) {
    const batchedNew = await getBatchedActivityAndFlags(user.id, missingClientIds);
    if (!cachedSignals) {
      cachedSignals = new Map();
    }
    // Merge new into cache
    for (const [cid, data] of batchedNew.entries()) {
      cachedSignals.set(cid, data);
    }
    setCachedRosterSignals(user.id, cachedSignals);
  }

  const activeConnectionsWithSignals = activeConnectionsRaw.map((conn) => {
    if (!conn.clientId) return { ...conn, signals: null, attentionFlags: [] };
    const data = cachedSignals?.get(conn.clientId);
    return { 
      ...conn, 
      signals: data?.signals || null, 
      attentionFlags: data?.attentionFlags || [] 
    };
  });`
);

fs.writeFileSync(path, content);
console.log("Patched!");
