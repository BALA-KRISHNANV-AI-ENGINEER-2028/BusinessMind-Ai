/**
 * Session Repository.
 *
 * Mongoose queries for active sessions, refresh token family rotation, and revocation.
 */

import { BaseRepository } from './base.repository';
import { SessionModel, ISessionDocument } from '../models/session.model';
import crypto from 'crypto';

export interface SessionEntity {
  id: string;
  userId: string;
  organizationId: string;
  tokenFamily: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  lastActiveAt: Date;
  createdAt: Date;
}

export class SessionRepository extends BaseRepository<
  ISessionDocument,
  SessionEntity,
  Partial<SessionEntity>,
  Partial<SessionEntity>
> {
  private localSessions = new Map<string, any>();

  constructor() {
    super(SessionModel);
  }

  protected toEntity(doc: ISessionDocument): SessionEntity {
    return {
      id: doc._id,
      userId: doc.userId,
      organizationId: doc.organizationId,
      tokenFamily: doc.tokenFamily,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      expiresAt: doc.expiresAt,
      isRevoked: doc.isRevoked,
      lastActiveAt: doc.lastActiveAt,
      createdAt: doc.createdAt,
    };
  }

  /** Hashes a raw refresh token using SHA-256 before database storage. */
  hashRefreshToken(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
  }

  async createSession(data: {
    userId: string;
    organizationId: string;
    tokenFamily: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SessionEntity> {
    if (!this.isConnected()) {
      const id = crypto.randomUUID();
      const session: SessionEntity = {
        id,
        userId: data.userId,
        organizationId: data.organizationId,
        tokenFamily: data.tokenFamily,
        ipAddress: data.ipAddress ?? '',
        userAgent: data.userAgent ?? '',
        expiresAt: data.expiresAt,
        isRevoked: false,
        lastActiveAt: new Date(),
        createdAt: new Date(),
      };
      this.localSessions.set(id, {
        ...session,
        refreshTokenHash: this.hashRefreshToken(data.refreshToken),
      });
      return session;
    }

    const doc = await this.model.create({
      userId: data.userId,
      organizationId: data.organizationId,
      tokenFamily: data.tokenFamily,
      refreshTokenHash: this.hashRefreshToken(data.refreshToken),
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress ?? '',
      userAgent: data.userAgent ?? '',
    });
    return this.toEntity(doc);
  }

  async findActiveByFamily(tokenFamily: string): Promise<SessionEntity | null> {
    if (!this.isConnected()) {
      const now = new Date();
      for (const s of this.localSessions.values()) {
        if (s.tokenFamily === tokenFamily && !s.isRevoked && new Date(s.expiresAt) > now) {
          return {
            id: s.id,
            userId: s.userId,
            organizationId: s.organizationId,
            tokenFamily: s.tokenFamily,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            expiresAt: s.expiresAt,
            isRevoked: s.isRevoked,
            lastActiveAt: s.lastActiveAt,
            createdAt: s.createdAt,
          };
        }
      }
      return null;
    }

    const doc = await this.model.findOne({
      tokenFamily,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async revokeFamily(tokenFamily: string): Promise<void> {
    if (!this.isConnected()) {
      for (const s of this.localSessions.values()) {
        if (s.tokenFamily === tokenFamily) {
          s.isRevoked = true;
        }
      }
      return;
    }
    await this.model.updateMany({ tokenFamily }, { $set: { isRevoked: true } }).exec();
  }

  async updateRefreshToken(id: string, newRefreshToken: string, newExpiresAt: Date): Promise<void> {
    if (!this.isConnected()) {
      const s = this.localSessions.get(id);
      if (s) {
        s.refreshTokenHash = this.hashRefreshToken(newRefreshToken);
        s.expiresAt = newExpiresAt;
        s.lastActiveAt = new Date();
      }
      return;
    }
    await this.model.findByIdAndUpdate(id, {
      $set: {
        refreshTokenHash: this.hashRefreshToken(newRefreshToken),
        expiresAt: newExpiresAt,
        lastActiveAt: new Date(),
      },
    }).exec();
  }

  async revokeSession(id: string): Promise<void> {
    if (!this.isConnected()) {
      const s = this.localSessions.get(id);
      if (s) s.isRevoked = true;
      return;
    }
    await this.model.findByIdAndUpdate(id, { $set: { isRevoked: true } }).exec();
  }

  async findUserSessions(userId: string): Promise<SessionEntity[]> {
    if (!this.isConnected()) {
      const now = new Date();
      return Array.from(this.localSessions.values())
        .filter((s) => s.userId === userId && !s.isRevoked && new Date(s.expiresAt) > now)
        .map((s) => ({
          id: s.id,
          userId: s.userId,
          organizationId: s.organizationId,
          tokenFamily: s.tokenFamily,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          expiresAt: s.expiresAt,
          isRevoked: s.isRevoked,
          lastActiveAt: s.lastActiveAt,
          createdAt: s.createdAt,
        }));
    }
    const docs = await this.model
      .find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } })
      .sort({ lastActiveAt: -1 })
      .exec();
    return docs.map((d) => this.toEntity(d));
  }
}

export const sessionRepository = new SessionRepository();
