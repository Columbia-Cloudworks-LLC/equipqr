type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface Logger {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

const isDevelopment = import.meta.env.DEV;

// Rate limiting to prevent spam
const logCache = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds

const shouldLog = (message: string): boolean => {
  if (!isDevelopment) return false;
  
  const now = Date.now();
  const lastLog = logCache.get(message);
  
  if (lastLog && now - lastLog < RATE_LIMIT_MS) {
    return false;
  }
  
  logCache.set(message, now);
  return true;
};

export const logger: Logger = {
  error: (message: string, ...args: any[]) => {
    // Always log errors, even in production
    console.error(`🚨 ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (shouldLog(message)) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (shouldLog(message)) {
      console.log(`🔍 ${message}`, ...args);
    }
  }
};

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of logCache.entries()) {
    if (now - timestamp > RATE_LIMIT_MS * 2) {
      logCache.delete(key);
    }
  }
}, RATE_LIMIT_MS * 2);