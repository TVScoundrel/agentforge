/**
 * Middleware Presets
 *
 * Pre-configured middleware combinations for common use cases.
 *
 * @module langgraph/middleware/presets
 */

import { development } from './preset-development.js';
import { production } from './preset-production.js';
import { testing } from './preset-testing.js';

export { development, production, testing };

export const presets = {
  production,
  development,
  testing,
};

export type {
  ProductionPresetOptions,
  DevelopmentPresetOptions,
  TestingPresetOptions,
  TestingPresetNode,
} from './preset-types.js';
