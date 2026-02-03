/**
 * Validation Utility Tools
 * 
 * Tools for validating data formats and types.
 */

import { createEmailValidatorTool } from './tools/email-validator.js';
import { createUrlValidatorSimpleTool } from './tools/url-validator-simple.js';
import { createPhoneValidatorTool } from './tools/phone-validator.js';
import { createCreditCardValidatorTool } from './tools/credit-card-validator.js';
import { createIpValidatorTool } from './tools/ip-validator.js';
import { createUuidValidatorTool } from './tools/uuid-validator.js';
import type { ValidationConfig } from './types.js';

// Default tool instances
export const emailValidator = createEmailValidatorTool();
export const urlValidatorSimple = createUrlValidatorSimpleTool();
export const phoneValidator = createPhoneValidatorTool();
export const creditCardValidator = createCreditCardValidatorTool();
export const ipValidator = createIpValidatorTool();
export const uuidValidator = createUuidValidatorTool();

// Tools array
export const validationTools = [
  emailValidator,
  urlValidatorSimple,
  phoneValidator,
  creditCardValidator,
  ipValidator,
  uuidValidator,
];

/**
 * Create validation tools with optional configuration
 */
export function createValidationTools(config: ValidationConfig = {}) {
  return [
    createEmailValidatorTool(),
    createUrlValidatorSimpleTool(),
    createPhoneValidatorTool(),
    createCreditCardValidatorTool(),
    createIpValidatorTool(),
    createUuidValidatorTool(),
  ];
}

// Re-export types
export * from './types.js';

// Re-export tool factory functions
export { createEmailValidatorTool } from './tools/email-validator.js';
export { createUrlValidatorSimpleTool } from './tools/url-validator-simple.js';
export { createPhoneValidatorTool } from './tools/phone-validator.js';
export { createCreditCardValidatorTool } from './tools/credit-card-validator.js';
export { createIpValidatorTool } from './tools/ip-validator.js';
export { createUuidValidatorTool } from './tools/uuid-validator.js';

