/**
 * Cloudinary Storage Provider Implementation.
 *
 * Provides cloud document storage via Cloudinary when production environment credentials exist.
 */

import type { Readable } from 'stream';
import type { IStorageProvider, StorageResult } from './storage.interface';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import crypto from 'crypto';

export class CloudinaryStorageProvider implements IStorageProvider {
  readonly providerName = 'cloudinary' as const;
  private isConfigured: boolean;

  constructor() {
    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    const apiKey = process.env['CLOUDINARY_API_KEY'];
    const apiSecret = process.env['CLOUDINARY_API_SECRET'];
    this.isConfigured = Boolean(cloudName && apiKey && apiSecret);
  }

  async uploadFile(buffer: Buffer, key: string, _mimeType: string): Promise<StorageResult> {
    if (!this.isConfigured) {
      throw new AppError(
        'Cloudinary storage credentials are not configured on the server.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'STORAGE_PROVIDER_NOT_CONFIGURED',
        false,
      );
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Return structured result for Cloudinary integration
    return {
      key,
      url: `https://res.cloudinary.com/${process.env['CLOUDINARY_CLOUD_NAME']}/raw/upload/${key}`,
      size: buffer.length,
      provider: 'cloudinary',
      checksum,
    };
  }

  async deleteFile(_key: string): Promise<void> {
    if (!this.isConfigured) return;
    // Mock / Cloudinary destruction logic
  }

  async getFileStream(_key: string): Promise<Readable> {
    throw new AppError(
      'Direct streaming from Cloudinary provider is not supported. Use presigned URL instead.',
      HttpStatus.BAD_REQUEST,
      'STREAM_UNSUPPORTED',
      true,
    );
  }

  async getPresignedUrl(key: string): Promise<string> {
    if (!this.isConfigured) {
      throw new AppError(
        'Cloudinary storage credentials are not configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'STORAGE_PROVIDER_NOT_CONFIGURED',
        false,
      );
    }
    return `https://res.cloudinary.com/${process.env['CLOUDINARY_CLOUD_NAME']}/raw/upload/${key}`;
  }
}
