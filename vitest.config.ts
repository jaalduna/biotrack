import { defineConfig } from 'vitest/config';

export default defineConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['./src/tests/setup.ts'],
  globals: {
    vi: {
      configurable: true,
      mock: true
    }
  }
});