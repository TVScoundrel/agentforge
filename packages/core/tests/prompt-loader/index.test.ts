import { describe } from 'vitest';
import { runCompatibilitySecurityTests } from './compatibility-security.behavior.js';
import { runFileLoadingTests } from './file-loading.behavior.js';
import { runRenderingTests } from './rendering.behavior.js';
import { runSanitizationTests } from './sanitization.behavior.js';

describe('Prompt Template Loader', () => {
  runSanitizationTests();
  runRenderingTests();
  runCompatibilitySecurityTests();
  runFileLoadingTests();
});
