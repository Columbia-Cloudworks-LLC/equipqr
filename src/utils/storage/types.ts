
/**
 * Common types for storage adapter implementations
 */

export type StorageValue = string | null;

export interface StorageAdapter {
  getItem(key: string): Promise<StorageValue>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
