/**
 * Phone Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { PhoneValidatorSchema } from '../types.js';

/**
 * Create phone validator tool
 */
export function createPhoneValidatorTool() {
  return toolBuilder()
    .name('phone-validator')
    .description('Validate if a string is a valid phone number format. Supports various international formats.')
    .category(ToolCategory.UTILITY)
    .tags(['validation', 'phone', 'validate'])
    .schema(PhoneValidatorSchema)
    .implement(async (input) => {
      // Basic phone validation - matches common formats
      // eslint-disable-next-line no-useless-escape
      const basicRegex = /^[\d\s\-\+\(\)]+$/;
      const strictRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
      
      const regex = input.strict ? strictRegex : basicRegex;
      const valid = regex.test(input.phone.replace(/\s/g, ''));
      
      return {
        valid,
        phone: input.phone,
        message: valid ? 'Valid phone number format' : 'Invalid phone number format',
      };
    })
    .build();
}

