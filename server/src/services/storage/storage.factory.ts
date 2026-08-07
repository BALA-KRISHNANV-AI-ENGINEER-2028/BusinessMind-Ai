/**
 * Storage Provider Factory.
 *
 * Dynamically selects and instantiates the active storage provider according to
 * environment settings (STORAGE_PROVIDER=local | cloudinary).
 */

import type { IStorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

export class StorageFactory {
  private static instance: IStorageProvider;

  static getProvider(): IStorageProvider {
    if (!StorageFactory.instance) {
      const providerType = process.env['STORAGE_PROVIDER']?.toLowerCase();
      if (providerType === 'cloudinary') {
        StorageFactory.instance = new CloudinaryStorageProvider();
      } else {
        StorageFactory.instance = new LocalStorageProvider();
      }
    }
    return StorageFactory.instance;
  }
}

export const storageProvider = StorageFactory.getProvider();
