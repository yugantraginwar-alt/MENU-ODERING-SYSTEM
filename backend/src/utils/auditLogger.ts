import { prisma } from '@/config/db';

interface AuditLogPayload {
  userId?: string;
  restaurantId?: string;
  branchId?: string;
  action: string;
  details: Record<string, any>;
}

/**
 * Persists an action to the AuditLog database table.
 */
export const logAudit = async (payload: AuditLogPayload) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId || null,
        restaurantId: payload.restaurantId || null,
        branchId: payload.branchId || null,
        action: payload.action,
        details: JSON.stringify(payload.details),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
export default logAudit;
