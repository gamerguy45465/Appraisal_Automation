// [L1] Import Vitest's typed configuration helper.
import { defineConfig } from 'vitest/config';
// [L2] Export a configuration that selects tests/**/*.test.ts and permits 15 seconds per test.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], testTimeout: 15000 } });
