import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock react-router-dom with proper MemoryRouter export
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Make vi globally available for tests
globalThis.vi = vi;

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    writable: true,
    configurable: true,
  });

  // Mock navigator.clipboard globally
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined)
    },
    writable: true,
    configurable: true
  });

  // Suppress specific warnings to reduce noise in test output
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    // Suppress React Router Future Flag warnings during tests
    const message = args[0]?.toString() || '';
    if (message.includes('React Router Future Flag Warning')) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    // Suppress specific Dialog accessibility warnings during tests
    const message = args[0]?.toString() || '';
    if (message.includes('Missing `Description`') || 
        message.includes('DialogContent` requires a `DialogTitle`')) {
      return;
    }
    originalError.apply(console, args);
  };
});