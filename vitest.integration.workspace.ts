import { defineWorkspace } from 'vitest/config';

/** Isolate relational integration tests from the default monorepo test workspace. */
export default defineWorkspace(['./vitest.integration.config.ts']);
