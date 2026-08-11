/**
 * Developer / Admin Account Seed Script.
 *
 * Idempotently creates or verifies the permanent application Developer/Admin account
 * in the MongoDB Atlas database using DEVELOPER_PASSWORD from environment variables.
 *
 * Usage:
 *   DEVELOPER_PASSWORD="your-strong-password" npm run seed:developer
 *
 * Requirements:
 * - Uses existing Mongoose connection and database models.
 * - Uses existing bcrypt password hashing (12 salt rounds).
 * - Idempotent — running multiple times will not duplicate records.
 * - Fails fast if DEVELOPER_PASSWORD environment variable is missing or insecure.
 * - Never prints secrets or plaintext passwords.
 */

import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase } from '../lib/database';
import { userRepository } from '../repositories/user.repository';
import { organizationRepository } from '../repositories/organization.repository';
import { OrganizationMemberModel } from '../models/organization-member.model';
import { hashPassword } from '../utils/password.util';
import { ROLES } from '../constants/app.constants';
import { logger } from '../config/logger.config';

const DEV_EMAIL = 'developer@businessmind-ai.com';
const DEV_FULL_NAME = 'BusinessMind Developer';
const DEV_ORG_NAME = 'BusinessMind Developer Workspace';
const DEV_ORG_SLUG = 'businessmind-developer-workspace';

/**
 * Validates production password strength requirements.
 * Throws a safe error without revealing password content if invalid.
 */
function validateDeveloperPassword(password: string): void {
  if (password.length < 12) {
    throw new Error('DEVELOPER_PASSWORD must be at least 12 characters long.');
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('DEVELOPER_PASSWORD must contain at least one uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('DEVELOPER_PASSWORD must contain at least one lowercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    throw new Error('DEVELOPER_PASSWORD must contain at least one number.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('DEVELOPER_PASSWORD must contain at least one special character.');
  }
}

export interface BootstrapOptions {
  throwOnMissingPassword?: boolean;
}

/**
 * Idempotently creates or verifies the developer account in MongoDB Atlas.
 * Operates on an existing MongoDB connection without closing it.
 */
export async function bootstrapDeveloperAccount(
  options: BootstrapOptions = {},
): Promise<void> {
  const existingRecord = await userRepository.findByEmail(DEV_EMAIL);

  if (existingRecord) {
    logger.info({ email: DEV_EMAIL }, 'Developer account already exists. Verifying status...');

    const { user, doc } = existingRecord;

    // Ensure user status is active
    if (doc.status !== 'active') {
      doc.status = 'active';
      await doc.save();
    }

    // Check organization membership
    let orgId = user.defaultOrganizationId;
    if (!orgId) {
      let org = await organizationRepository.findBySlug(DEV_ORG_SLUG);
      if (!org) {
        org = await organizationRepository.create({
          id: uuidv4(),
          name: DEV_ORG_NAME,
          slug: DEV_ORG_SLUG,
          plan: 'enterprise',
          status: 'active',
          settings: { allowedDomains: [], maxMembers: 100, mfaRequired: false },
        });
      }
      orgId = org.id;
      doc.defaultOrganizationId = orgId;
      await doc.save();
    }

    // Ensure membership exists with SUPER_ADMIN role
    const existingMembership = await OrganizationMemberModel.findOne({
      organizationId: orgId,
      userId: user.id,
      deletedAt: null,
    }).exec();

    if (!existingMembership) {
      await organizationRepository.addMember({
        organizationId: orgId,
        userId: user.id,
        role: ROLES.SUPER_ADMIN,
        status: 'active',
      });
    } else if (
      existingMembership.role !== ROLES.SUPER_ADMIN ||
      existingMembership.status !== 'active'
    ) {
      existingMembership.role = ROLES.SUPER_ADMIN;
      existingMembership.status = 'active';
      await existingMembership.save();
    }

    logger.info({ email: DEV_EMAIL }, 'Developer account verified successfully.');
    return;
  }

  // Developer account does NOT exist — requires DEVELOPER_PASSWORD
  const plainPassword = process.env['DEVELOPER_PASSWORD'];

  if (!plainPassword) {
    const errorMsg =
      'DEVELOPER_PASSWORD environment variable is required to create developer account, but was not found.';
    logger.error({ email: DEV_EMAIL }, errorMsg);
    if (options.throwOnMissingPassword) {
      throw new Error(errorMsg);
    }
    return;
  }

  // Validate password strength before creation
  try {
    validateDeveloperPassword(plainPassword);
  } catch (err) {
    const errorMsg = (err as Error).message;
    logger.error({ email: DEV_EMAIL }, `Invalid DEVELOPER_PASSWORD: ${errorMsg}`);
    if (options.throwOnMissingPassword) {
      throw err;
    }
    return;
  }

  // Create Organization if missing
  let org = await organizationRepository.findBySlug(DEV_ORG_SLUG);
  if (!org) {
    org = await organizationRepository.create({
      id: uuidv4(),
      name: DEV_ORG_NAME,
      slug: DEV_ORG_SLUG,
      plan: 'enterprise',
      status: 'active',
      settings: { allowedDomains: [], maxMembers: 100, mfaRequired: false },
    });
  }

  // Hash password securely with existing bcrypt utility
  const passwordHash = await hashPassword(plainPassword);

  // Create User
  const user = await userRepository.create({
    id: uuidv4(),
    email: DEV_EMAIL,
    passwordHash,
    fullName: DEV_FULL_NAME,
    jobTitle: 'Lead Systems Developer & Admin',
    defaultOrganizationId: org.id,
    status: 'active',
    preferences: {
      timezone: 'America/New_York',
      language: 'en-US',
      emailNotifications: true,
      marketingEmails: false,
    },
  });

  // Add Org Admin / Super Admin Member
  await organizationRepository.addMember({
    organizationId: org.id,
    userId: user.id,
    role: ROLES.SUPER_ADMIN,
    status: 'active',
  });

  logger.info({ email: DEV_EMAIL }, 'Developer account created successfully.');
}

export async function seedDeveloperAccount(): Promise<void> {
  console.log('Connecting to MongoDB Atlas...');
  await connectDatabase();

  try {
    await bootstrapDeveloperAccount({ throwOnMissingPassword: true });
  } finally {
    await disconnectDatabase();
    console.log('MongoDB connection closed.');
  }
}

// Execute script if run directly
if (require.main === module) {
  seedDeveloperAccount()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed developer account:', err.message);
      process.exit(1);
    });
}

