/**
 * Email Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { EmailValidatorSchema } from '../types.js';

/**
 * Create email validator tool
 */
export function createEmailValidatorTool() {
  return toolBuilder()
    .name('email-validator')
    .description('Validate if a string is a valid email address format.')
    .category(ToolCategory.UTILITY)
    .tags(['validation', 'email', 'validate'])
    .schema(EmailValidatorSchema)
    .implement(async (input) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const valid = emailRegex.test(input.email);
      
      return {
        valid,
        email: input.email,
        message: valid ? 'Valid email address' : 'Invalid email address format',
      };
    })
    .build();
}

