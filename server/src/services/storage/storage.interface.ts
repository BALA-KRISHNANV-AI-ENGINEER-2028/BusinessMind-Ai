/**
 * Storage Abstraction Layer — Provider Interface.
 *
 * Decouples business logic and document services from specific storage providers
 * (e.g. Local Disk, Cloudinary, AWS S3, Azure Blob, GCS).
 */

import type { Readable } from 'stream';

export interface StorageResult {
  key: string;
  url: string;
  size: number;
  provider: 'local' | 'cloudinary';
  checksum: string;
}

export interface IStorageProvider {
  readonly providerName: 'local' | 'cloudinary';

  /**
   * Uploads a file buffer to storage.
   */
  uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<StorageResult>;

  /**
   * Deletes a file from storage.
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Retrieves a readable stream for a file.
   */
  getFileStream(key: string): Promise<Readable>;

  /**
   * Generates a accessible URL/path for the file.
   */
  getPresignedUrl(key: string): Promise<string>;
}
