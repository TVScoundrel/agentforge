/**
 * Skills system exports
 */

// Type definitions
export type {
  SkillMetadata,
  Skill,
  SkillRegistryConfig,
  SkillRootConfig,
  SkillPromptOptions,
  SkillEventHandler,
  SkillParseResult,
  SkillValidationError,
  TrustLevel,
  TrustPolicyDecision,
} from './types.js';

export { SkillRegistryEvent, TrustPolicyReason } from './types.js';

// Parser
export {
  parseSkillContent,
  validateSkillName,
  validateSkillDescription,
  validateSkillNameMatchesDir,
} from './parser.js';

// Scanner
export {
  scanSkillRoot,
  scanAllSkillRoots,
  expandHome,
  type SkillCandidate,
} from './scanner.js';

// Registry
export { SkillRegistry } from './registry.js';

// Activation Tools
export {
  createActivateSkillTool,
  createReadSkillResourceTool,
  createSkillActivationTools,
  resolveResourcePath,
} from './activation.js';

// Trust Policy
export {
  evaluateTrustPolicy,
  isScriptResource,
  normalizeRootConfig,
} from './trust.js';
