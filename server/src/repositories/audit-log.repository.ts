/**
 * AuditLog Repository.
 *
 * Mongoose queries for enterprise audit logs.
 */

import { BaseRepository } from './base.repository';
import { AuditLogModel, IAuditLogDocument } from '../models/audit-log.model';

export interface AuditLogEntity {
  id: string;
  organizationId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditLogRepository extends BaseRepository<
  IAuditLogDocument,
  AuditLogEntity,
  Partial<AuditLogEntity>,
  Partial<AuditLogEntity>
> {
  constructor() {
    super(AuditLogModel);
  }

  protected toEntity(doc: IAuditLogDocument): AuditLogEntity {
    return {
      id: doc._id,
      organizationId: doc.organizationId,
      userId: doc.userId,
      action: doc.action,
      resource: doc.resource,
      resourceId: doc.resourceId,
      details: doc.details ?? {},
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      createdAt: doc.createdAt,
    };
  }
}

export const auditLogRepository = new AuditLogRepository();
