import { BatchedClientData } from "../data/batch-activity-signals";

interface CacheEntry {
  data: Map<string, BatchedClientData>;
  timestamp: number;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// In-memory cache mapping coachId to their BatchedClientData Map
const rosterCache = new Map<string, CacheEntry>();

export function getCachedRosterSignals(coachId: string): Map<string, BatchedClientData> | null {
  const entry = rosterCache.get(coachId);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    rosterCache.delete(coachId);
    return null;
  }

  return entry.data;
}

export function setCachedRosterSignals(coachId: string, data: Map<string, BatchedClientData>) {
  rosterCache.set(coachId, {
    data,
    timestamp: Date.now()
  });
}

export function invalidateRosterCache(coachId: string) {
  rosterCache.delete(coachId);
}
