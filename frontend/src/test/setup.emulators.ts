 
// Emulator-focused test setup: no Firebase module mocks, connect to local emulators.

import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';

// Extend expect
expect.extend(matchers);

// Core JSDOM helpers (no Firebase mocks)
beforeEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

// JSDOM shims used across tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Minimal environment for Firebase config + emulator toggles
beforeAll(() => {
  // Ensure development mode semantics
  process.env.NODE_ENV = 'development';

  // Inject Vite env for frontend code
  Object.defineProperty(import.meta, 'env', {
    value: {
      MODE: 'test',
      DEV: true,
      // Firebase basic config (dummy values OK for emulator usage)
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
      VITE_FIREBASE_PROJECT_ID: 'demo-test',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-test.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: 'test-app-id',
      // Enable emulator connections in src/config/firebase.ts
      VITE_ENABLE_EMULATORS: 'true',
      VITE_USE_PRODUCTION_AUTH: 'false',
      // Streaming + OpenRouter test safety
      VITE_STREAMING_ENABLED: 'true',
      OPENROUTER_USE_MOCK: 'true',
    },
    writable: true,
  });

  // Provide EventSource for SSE tests when needed
  const listeners: Record<string, ((ev: MessageEvent) => void)[]> = {};
  class MockEventSource {
    url: string;
    readyState = 1;
    onopen: ((ev: any) => void) | null = null;
    onmessage: ((ev: any) => void) | null = null;
    onerror: ((ev: any) => void) | null = null;
    constructor(url: string) {
      this.url = url;
      setTimeout(() => this.onopen && this.onopen(new MessageEvent('open')), 0);
    }
    addEventListener(type: 'message', cb: (ev: MessageEvent) => void) {
      listeners[type] ||= [];
      listeners[type].push(cb);
    }
    removeEventListener() {}
    close() {
      this.readyState = 2;
    }
    // test helper
    static simulateMessage(data: unknown) {
      const ev = new MessageEvent('message', { data: typeof data === 'string' ? data : JSON.stringify(data) });
      listeners['message']?.forEach((cb) => cb(ev));
    }
  }
  (globalThis as any).EventSource = MockEventSource as any;
  (window as any).EventSource = MockEventSource as any;
});

// Silence noisy console warnings during emulator tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('axe-core') || args[0].includes('validateDOMNesting'))) return;
  originalWarn(...args);
};

