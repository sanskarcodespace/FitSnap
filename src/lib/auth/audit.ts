import prisma from "@/lib/db/prisma";

export type AuditEvent = {
  actorUserId?: string;
  actorRole?: string;
  eventType: string;
  targetUserId?: string;
  metadata?: any;
  ipAddressPartial?: string;
};

export async function logAuditEvent(event: AuditEvent) {
  try {
    await prisma.auditLogEntry.create({
      data: {
        actorUserId: event.actorUserId || null,
        actorRole: event.actorRole || null,
        eventType: event.eventType,
        targetUserId: event.targetUserId || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        ipAddressPartial: event.ipAddressPartial || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log entry:", error);
    // Suppress throwing error to ensure audit failure does not break the main flow.
  }
}
