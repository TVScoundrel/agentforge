/**
 * Credit Card Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { CreditCardValidatorSchema } from '../types.js';

/**
 * Create credit card validator tool
 */
export function createCreditCardValidatorTool() {
  return toolBuilder()
    .name('credit-card-validator')
    .description('Validate if a string is a valid credit card number using the Luhn algorithm.')
    .category(ToolCategory.UTILITY)
    .tags(['validation', 'credit-card', 'validate', 'luhn'])
    .schema(CreditCardValidatorSchema)
    .implement(async (input) => {
      // Remove spaces and dashes
      // eslint-disable-next-line no-useless-escape
      const cleaned = input.cardNumber.replace(/[\s\-]/g, '');
      
      // Check if it's all digits
      if (!/^\d+$/.test(cleaned)) {
        return {
          valid: false,
          message: 'Card number must contain only digits',
        };
      }
      
      // Luhn algorithm
      let sum = 0;
      let isEven = false;
      
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);
        
        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        
        sum += digit;
        isEven = !isEven;
      }
      
      const valid = sum % 10 === 0;
      
      return {
        valid,
        cardNumber: input.cardNumber,
        message: valid ? 'Valid credit card number' : 'Invalid credit card number (failed Luhn check)',
      };
    })
    .build();
}

