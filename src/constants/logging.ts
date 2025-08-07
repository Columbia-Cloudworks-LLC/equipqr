// Debug logging constants
export const DEBUG_MODE = import.meta.env.DEV;

export const DEBUG_PREFIXES = {
  FILE_SELECTION: '🔍',
  UPLOAD: '🚀',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  AUTH: '🔐',
  REDIRECT: '🎯',
  REFRESH: '🔄',
  CLEANUP: '🧹',
  SESSION: '⏰',
  PM: '🔧',
} as const;

export const debugLog = (prefix: string, message: string, ...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log(`${prefix} ${message}`, ...args);
  }
};

export const debugError = (prefix: string, message: string, ...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.error(`${prefix} ${message}`, ...args);
  }
};