
import { CrossPlatformStorage } from './crossPlatformStorage';

/**
 * Creates a storage object compatible with Supabase Auth
 * that provides better reliability on mobile devices
 */
export const createSupabaseStorage = () => {
  const crossPlatformStorage = new CrossPlatformStorage();
  
  return {
    getItem: async (key: string) => {
      console.log('Storage: Getting item', key);
      const value = await crossPlatformStorage.getItem(key);
      console.log('Storage: Got item', key, value ? '[value exists]' : 'null');
      return value;
    },
    setItem: async (key: string, value: string) => {
      console.log('Storage: Setting item', key);
      await crossPlatformStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      console.log('Storage: Removing item', key);
      await crossPlatformStorage.removeItem(key);
    }
  };
};
