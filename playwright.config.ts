import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for API-only testing.
 *
 * There are no browsers involved here — we use `@playwright/test` purely for
 * its test runner + `request` fixture, which is excellent for hammering HTTP
 * APIs from TypeScript.
 *
 * The runner auto-boots the server via `webServer` before any spec runs, and
 * tears it down cleanly when the suite finishes.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3333',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  // Spin up `npm run dev` before any test; reuse a running instance if one
  // is already listening locally (so CI and interactive dev both work).
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3333/health',
    reuseExistingServer: true,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
