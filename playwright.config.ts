// [L1] Import Playwright's typed configuration helper.
import { defineConfig } from '@playwright/test';
// [L2] Export the browser-test configuration through defineConfig.
export default defineConfig({
  // [L3] Find spec.ts tests under tests, disable full parallel execution, and run with one worker.
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: false, workers: 1,
  // [L4] Allow 30 seconds per test; use headless browsers with traces and screenshots disabled.
  timeout: 30000, use: { headless: true, trace: 'off', screenshot: 'off' },
// [L5] Finish the browser-test configuration and its export.
});
