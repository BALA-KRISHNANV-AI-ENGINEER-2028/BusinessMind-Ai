/**
 * Local Disk Storage Provider Implementation.
 *
 * Stores uploaded documents safely on the local file system for local development & testing.
 * Strictly prevents path traversal by normalizing and scoping paths to the configured base folder.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Readable } from 'stream';
import type { IStorageProvider, StorageResult } from './storage.interface';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';

export class LocalStorageProvider implements IStorageProvider {
  readonly providerName = 'local' as const;
  private readonly uploadDir: string;

  constructor(baseUploadDir?: string) {
    this.uploadDir = baseUploadDir
      ? path.resolve(baseUploadDir)
      : path.resolve(process.cwd(), 'uploads', 'documents');

    this.ensureDirectoryExists(this.uploadDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private resolveSafePath(key: string): string {
    // Strictly prevent path traversal or null byte injection attempts
    if (key.includes('..') || key.includes('\0')) {
      throw new AppError(
        'Security Error: Path traversal attempt detected.',
        HttpStatus.BAD_REQUEST,
        'PATH_TRAVERSAL_DETECTED',
        true,
      );
    }

    const absolutePath = path.resolve(this.uploadDir, key);

    if (!absolutePath.startsWith(this.uploadDir)) {
      throw new AppError(
        'Security Error: Path traversal attempt detected.',
        HttpStatus.BAD_REQUEST,
        'PATH_TRAVERSAL_DETECTED',
        true,
      );
    }

    return absolutePath;
  }

  async uploadFile(buffer: Buffer, key: string, _mimeType: string): Promise<StorageResult> {
    const filePath = this.resolveSafePath(key);
    const parentDir = path.dirname(filePath);
    this.ensureDirectoryExists(parentDir);

    await fs.promises.writeFile(filePath, buffer);

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      key,
      url: `/api/v1/documents/storage/${encodeURIComponent(key)}`,
      size: buffer.length,
      provider: 'local',
      checksum,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async getFileStream(key: string): Promise<Readable> {
    const filePath = this.resolveSafePath(key);
    if (!fs.existsSync(filePath)) {
      throw new AppError(
        'File not found in storage.',
        HttpStatus.NOT_FOUND,
        'FILE_NOT_FOUND',
        true,
      );
    }
    return fs.createReadStream(filePath);
  }

  async getPresignedUrl(key: string): Promise<string> {
    const filePath = this.resolveSafePath(key);
    if (!fs.existsSync(filePath)) {
      throw new AppError(
        'File not found in storage.',
        HttpStatus.NOT_FOUND,
        'FILE_NOT_FOUND',
        true,
      );
    }
    return `/api/v1/documents/storage/${encodeURIComponent(key)}`;
  }
}
