/**
 * AuditLog Service.
 *
 * Enterprise helper for recording security, authentication, and organizational audit trails.
 */

import { auditLogRepository } from '../repositories/audit-log.repository';
import { logger } from '../config/logger.config';

export interface AuditLogOptions {
  organizationId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  async log(options: AuditLogOptions): Promise<void> {
    try {
      await auditLogRepository.create({
        organizationId: options.organizationId,
        userId: options.userId,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId,
        details: options.details ?? {},
        ipAddress: options.ipAddress ?? '',
        userAgent: options.userAgent ?? '',
      });

      logger.info(
        {
          action: options.action,
          userId: options.userId,
          organizationId: options.organizationId,
        },
        `[AuditLog] ${options.action}`,
      );
    } catch (err) {
      logger.error({ err, options }, 'Failed to write audit log entry');
    }
  }
}

export const auditLogService = new AuditLogService();
