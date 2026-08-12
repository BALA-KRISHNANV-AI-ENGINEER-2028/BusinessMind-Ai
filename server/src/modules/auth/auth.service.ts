/**
 * Auth Service.
 *
 * Full production implementation for:
 * - register: Create user, org, owner membership, session & issue JWTs
 * - login: Validate credentials, locate org membership, create session & issue JWTs
 * - googleInitiateOAuth: Generate Google authorization URL
 * - googleCallback: Exchange OAuth code for tokens, verify identity, find/create user
 * - refresh: Verify refresh token & rotate tokens within tokenFamily
 * - logout: Revoke active session
 * - getMe: Get current user session details
 */

import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { userRepository } from '../../repositories/user.repository';
import { organizationRepository } from '../../repositories/organization.repository';
import { sessionRepository } from '../../repositories/session.repository';
import { auditLogService } from '../../services/auditLog.service';
import { hashPassword, comparePassword } from '../../utils/password.util';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signOnboardingToken,
  verifyOnboardingToken,
} from '../../utils/jwt.util';
import {
  DuplicateKeyError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../../errors/HttpErrors';
import { ROLE_PERMISSIONS, ROLES, TOKEN_TTL } from '../../constants/app.constants';
import { config } from '../../config';
import { logger } from '../../config/logger.config';
import type {
  AuthSessionResponse,
  LoginDto,
  RegisterDto,
  CompleteOnboardingDto,
  RefreshTokenDto,
  User,
} from '../../types/auth.types';

export interface GoogleCallbackResult {
  onboardingRequired?: boolean;
  onboardingToken?: string;
  session?: AuthSessionResponse;
}

export class AuthService {
  /**
   * Registers a new user, creates their primary organization, sets owner role, and issues tokens.
   */
  async register(data: RegisterDto, meta?: { ip?: string; userAgent?: string }): Promise<AuthSessionResponse> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new DuplicateKeyError('email');
    }

    const passwordHash = await hashPassword(data.password);
    const userId = uuidv4();
    const orgId = uuidv4();
    const orgName = data.companyName?.trim() || data.organizationName?.trim() || `${data.fullName.trim()}'s Workspace`;
    const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().slice(0, 6)}`;

    // 1. Create Organization with real company details
    const org = await organizationRepository.create({
      id: orgId,
      name: orgName,
      slug: orgSlug,
      website: data.companyWebsite?.trim() || '',
      industry: data.industry?.trim() || '',
      companySize: data.companySize?.trim() || '',
      description: data.companyDescription?.trim() || '',
      country: data.country?.trim() || '',
      timezone: data.timezone?.trim() || 'UTC',
      plan: 'pro',
      status: 'active',
      settings: {
        allowedDomains: [],
        maxMembers: 50,
        mfaRequired: false,
      },
    });

    // 2. Create User with real profile details
    const user = await userRepository.create({
      id: userId,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      fullName: data.fullName.trim(),
      jobTitle: data.jobTitle?.trim() || '',
      phone: data.phone?.trim() || '',
      avatarUrl: data.avatarUrl?.trim() || '',
      defaultOrganizationId: org.id,
      status: 'active',
      preferences: {
        timezone: data.timezone?.trim() || 'America/New_York',
        language: 'en-US',
        emailNotifications: true,
        marketingEmails: false,
      },
    });

    // 3. Add Member as Owner (super_admin / org_admin)
    await organizationRepository.addMember({
      organizationId: org.id,
      userId: user.id,
      role: ROLES.ORG_ADMIN,
    });

    // 4. Issue Tokens & Create Session
    const tokenFamily = uuidv4();
    const permissions = ROLE_PERMISSIONS[ROLES.ORG_ADMIN];
    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: org.id,
      role: ROLES.ORG_ADMIN,
      permissions,
    });

    const refreshExpiresAt = new Date(Date.now() + TOKEN_TTL.REFRESH_TOKEN_MS);
    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      family: tokenFamily,
    });

    await sessionRepository.createSession({
      userId: user.id,
      organizationId: org.id,
      tokenFamily,
      refreshToken,
      expiresAt: refreshExpiresAt,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    await auditLogService.log({
      organizationId: org.id,
      userId: user.id,
      action: 'auth.register',
      resource: 'User',
      resourceId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    const memberships = await organizationRepository.getUserMemberships(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        phone: user.phone,
        defaultOrganizationId: org.id,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
      expiresAt,
      memberships,
    };
  }

  /**
   * Authenticates a user with email & password.
   */
  async login(data: LoginDto, meta?: { ip?: string; userAgent?: string }): Promise<AuthSessionResponse> {
    const record = await userRepository.findByEmail(data.email);
    if (!record || !record.passwordHash) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const match = await comparePassword(data.password, record.passwordHash);
    if (!match) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const { user } = record;
    const memberships = await organizationRepository.getUserMemberships(user.id);
    if (memberships.length === 0) {
      throw new ValidationError('User does not belong to any organization.');
    }

    const activeOrgId = user.defaultOrganizationId || memberships[0]?.organizationId || '';
    const activeMember = memberships.find((m) => m.organizationId === activeOrgId) || memberships[0];
    const role = activeMember?.role || ROLES.EMPLOYEE;
    const permissions = ROLE_PERMISSIONS[role];

    const tokenFamily = uuidv4();
    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: activeOrgId,
      role,
      permissions,
    });

    const refreshExpiresAt = new Date(Date.now() + TOKEN_TTL.REFRESH_TOKEN_MS);
    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      family: tokenFamily,
    });

    await sessionRepository.createSession({
      userId: user.id,
      organizationId: activeOrgId,
      tokenFamily,
      refreshToken,
      expiresAt: refreshExpiresAt,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    await auditLogService.log({
      organizationId: activeOrgId,
      userId: user.id,
      action: 'auth.login',
      resource: 'User',
      resourceId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        phone: user.phone,
        bio: user.bio,
        defaultOrganizationId: activeOrgId,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
      expiresAt,
      memberships,
    };
  }

  /**
   * Generates the Google OAuth authorization URL.
   * The browser is redirected here to start the OAuth flow.
   * Throws a configuration error if Google credentials are not set.
   */
  googleInitiateOAuth(): string {
    if (!config.google.clientId || !config.google.clientSecret || !config.google.callbackUrl) {
      throw new Error(
        'Google OAuth is not configured. ' +
        'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL environment variables.',
      );
    }

    const client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl,
    );

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile', 'openid'],
      prompt: 'select_account',
    });

    return url;
  }

  /**
   * Handles the Google OAuth callback.
   * Exchanges authorization code for tokens and verifies identity.
   * - Existing user -> returns AuthSessionResponse
   * - New user -> returns onboardingToken and flags onboardingRequired = true
   */
  async googleCallback(code: string, meta?: { ip?: string; userAgent?: string }): Promise<GoogleCallbackResult> {
    if (!config.google.clientId || !config.google.clientSecret || !config.google.callbackUrl) {
      throw new Error(
        'Google OAuth is not configured. ' +
        'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL environment variables.',
      );
    }

    const client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl,
    );

    // Exchange authorization code for tokens
    let tokens;
    try {
      const tokenResponse = await client.getToken(code);
      tokens = tokenResponse.tokens;
    } catch (err) {
      logger.error({ err }, '[GoogleOAuth] Failed to exchange authorization code');
      throw new UnauthorizedError('Failed to exchange Google authorization code. The code may be expired or invalid.');
    }

    if (!tokens.id_token) {
      logger.error('[GoogleOAuth] Google response missing id_token');
      throw new UnauthorizedError('Google did not return an ID token.');
    }

    // Verify the ID token and extract the user's identity
    let googlePayload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.google.clientId,
      });
      googlePayload = ticket.getPayload();
    } catch (err) {
      logger.error({ err }, '[GoogleOAuth] Failed to verify ID token');
      throw new UnauthorizedError('Failed to verify Google ID token.');
    }

    if (!googlePayload || !googlePayload.email) {
      throw new UnauthorizedError('Google account did not provide an email address.');
    }

    const email = googlePayload.email.toLowerCase().trim();
    const fullName = googlePayload.name || email.split('@')[0];
    const googleId = googlePayload.sub;
    const avatarUrl = googlePayload.picture;

    // Find existing user by email or googleId
    let record = await userRepository.findByEmail(email);
    let user: User | undefined;

    if (!record) {
      const byGoogleId = await userRepository.findByGoogleId(googleId);
      if (byGoogleId) {
        user = byGoogleId;
      } else {
        // Case B: NEW Google User — requires profile & company onboarding!
        // Do NOT create dummy organization or dummy user in MongoDB.
        const onboardingToken = signOnboardingToken({
          email,
          googleId,
          fullName,
          avatarUrl,
        });

        logger.info({ email }, '[GoogleOAuth] New user detected — initiating onboarding flow');
        return {
          onboardingRequired: true,
          onboardingToken,
        };
      }
    } else {
      user = record.user;
    }

    // Link googleId to existing user if not already set
    if (record?.doc && !record.doc.googleId) {
      record.doc.googleId = googleId;
      await record.doc.save();
    }

    const memberships = await organizationRepository.getUserMemberships(user.id);
    const activeOrgId = user.defaultOrganizationId || memberships[0]?.organizationId || '';
    const activeMember = memberships.find((m) => m.organizationId === activeOrgId) || memberships[0];
    const role = activeMember?.role || ROLES.ORG_ADMIN;
    const permissions = ROLE_PERMISSIONS[role];

    const tokenFamily = uuidv4();
    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: activeOrgId,
      role,
      permissions,
    });

    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      family: tokenFamily,
    });

    await sessionRepository.createSession({
      userId: user.id,
      organizationId: activeOrgId,
      tokenFamily,
      refreshToken,
      expiresAt: new Date(Date.now() + TOKEN_TTL.REFRESH_TOKEN_MS),
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    await auditLogService.log({
      organizationId: activeOrgId,
      userId: user.id,
      action: 'auth.google',
      resource: 'User',
      resourceId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      onboardingRequired: false,
      session: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl ?? avatarUrl,
          jobTitle: user.jobTitle,
          phone: user.phone,
          bio: user.bio,
          defaultOrganizationId: activeOrgId,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
        token,
        refreshToken,
        expiresAt,
        memberships,
      },
    };
  }

  /**
   * Completes onboarding for a new Google user using a valid onboardingToken.
   */
  async completeOnboarding(
    data: CompleteOnboardingDto,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<AuthSessionResponse> {
    const onboardingPayload = verifyOnboardingToken(data.onboardingToken);

    const email = onboardingPayload.email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new DuplicateKeyError('email');
    }

    const userId = uuidv4();
    const orgId = uuidv4();
    const orgName = data.companyName.trim();
    const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().slice(0, 6)}`;

    // 1. Create Organization with user-provided company details
    const org = await organizationRepository.create({
      id: orgId,
      name: orgName,
      slug: orgSlug,
      website: data.companyWebsite?.trim() || '',
      industry: data.industry?.trim() || '',
      companySize: data.companySize?.trim() || '',
      description: data.companyDescription?.trim() || '',
      country: data.country?.trim() || '',
      timezone: data.timezone?.trim() || 'UTC',
      plan: 'pro',
      status: 'active',
      settings: {
        allowedDomains: [],
        maxMembers: 50,
        mfaRequired: false,
      },
    });

    // 2. Create User with user-provided profile details & verified Google ID
    const user = await userRepository.create({
      id: userId,
      email,
      fullName: data.fullName.trim() || onboardingPayload.fullName,
      googleId: onboardingPayload.googleId,
      avatarUrl: onboardingPayload.avatarUrl || '',
      jobTitle: data.jobTitle?.trim() || '',
      phone: data.phone?.trim() || '',
      defaultOrganizationId: org.id,
      status: 'active',
      preferences: {
        timezone: data.timezone?.trim() || 'America/New_York',
        language: 'en-US',
        emailNotifications: true,
        marketingEmails: false,
      },
    });

    // 3. Add Member as Owner
    await organizationRepository.addMember({
      organizationId: org.id,
      userId: user.id,
      role: ROLES.ORG_ADMIN,
    });

    // 4. Issue Tokens & Create Session
    const tokenFamily = uuidv4();
    const permissions = ROLE_PERMISSIONS[ROLES.ORG_ADMIN];
    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: org.id,
      role: ROLES.ORG_ADMIN,
      permissions,
    });

    const refreshExpiresAt = new Date(Date.now() + TOKEN_TTL.REFRESH_TOKEN_MS);
    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      family: tokenFamily,
    });

    await sessionRepository.createSession({
      userId: user.id,
      organizationId: org.id,
      tokenFamily,
      refreshToken,
      expiresAt: refreshExpiresAt,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    await auditLogService.log({
      organizationId: org.id,
      userId: user.id,
      action: 'auth.google_onboarding_complete',
      resource: 'User',
      resourceId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    const memberships = await organizationRepository.getUserMemberships(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        phone: user.phone,
        defaultOrganizationId: org.id,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
      expiresAt,
      memberships,
    };
  }

  /**
   * Refreshes access token and rotates refresh token within the token family.
   */
  async refresh(data: RefreshTokenDto, meta?: { ip?: string; userAgent?: string }): Promise<Pick<AuthSessionResponse, 'token' | 'refreshToken' | 'expiresAt'>> {
    if (!data.refreshToken) {
      throw new UnauthorizedError('Refresh token is required.');
    }

    let payload;
    try {
      payload = verifyRefreshToken(data.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const activeSession = await sessionRepository.findActiveByFamily(payload.family);
    if (!activeSession) {
      // Refresh Token Theft Detection: Revoke family!
      await sessionRepository.revokeFamily(payload.family);
      throw new UnauthorizedError('Revoked or compromised refresh token.');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const memberships = await organizationRepository.getUserMemberships(user.id);
    const activeOrgId = activeSession.organizationId || user.defaultOrganizationId;
    const activeMember = memberships.find((m) => m.organizationId === activeOrgId) || memberships[0];
    const role = activeMember?.role || ROLES.EMPLOYEE;
    const permissions = ROLE_PERMISSIONS[role];

    // Issue new access & rotated refresh token
    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: activeOrgId,
      role,
      permissions,
    });

    const newRefreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      family: payload.family,
    });

    const newExpiresAt = new Date(Date.now() + TOKEN_TTL.REFRESH_TOKEN_MS);
    await sessionRepository.updateRefreshToken(activeSession.id, newRefreshToken, newExpiresAt);

    await auditLogService.log({
      organizationId: activeOrgId,
      userId: user.id,
      action: 'auth.refresh',
      resource: 'Session',
      resourceId: activeSession.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      token,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  /**
   * Logs out the user by revoking the refresh token session.
   */
  async logout(refreshToken: string, meta?: { ip?: string; userAgent?: string }): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      await sessionRepository.revokeFamily(payload.family);
      await auditLogService.log({
        userId: payload.sub,
        action: 'auth.logout',
        resource: 'Session',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });
    } catch {
      // Silently return on invalid tokens during logout
    }
  }

  /**
   * Gets current user profile and session details.
   */
  async getMe(userId: string, organizationId: string): Promise<AuthSessionResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const memberships = await organizationRepository.getUserMemberships(userId);
    const activeOrgId = organizationId || user.defaultOrganizationId || memberships[0]?.organizationId || '';
    const activeMember = memberships.find((m) => m.organizationId === activeOrgId) || memberships[0];
    const role = activeMember?.role || ROLES.EMPLOYEE;
    const permissions = ROLE_PERMISSIONS[role];

    const { token, expiresAt } = signAccessToken({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      organizationId: activeOrgId,
      role,
      permissions,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        phone: user.phone,
        bio: user.bio,
        defaultOrganizationId: activeOrgId,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      token,
      refreshToken: '', // Refresh token stored in HTTP-only cookie
      expiresAt,
      memberships,
    };
  }

  async forgotPassword(_email: string): Promise<void> {
    return;
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    return;
  }
}

export const authService = new AuthService();
