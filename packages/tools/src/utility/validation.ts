/**
 * Validation Utility Tools
 * 
 * Tools for validating data formats and types.
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

/**
 * Email validator tool
 */
export const emailValidator = toolBuilder()
  .name('email-validator')
  .description('Validate if a string is a valid email address format.')
  .category(ToolCategory.UTILITY)
  .tags(['validation', 'email', 'validate'])
  .schema(z.object({
    email: z.string().describe('Email address to validate'),
  }))
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

/**
 * URL validator tool (already exists in web tools, but adding here for completeness)
 */
export const urlValidatorSimple = toolBuilder()
  .name('url-validator-simple')
  .description('Validate if a string is a valid URL format.')
  .category(ToolCategory.UTILITY)
  .tags(['validation', 'url', 'validate'])
  .schema(z.object({
    url: z.string().describe('URL to validate'),
  }))
  .implement(async (input) => {
    try {
      new URL(input.url);
      return {
        valid: true,
        url: input.url,
        message: 'Valid URL',
      };
    } catch {
      return {
        valid: false,
        url: input.url,
        message: 'Invalid URL format',
      };
    }
  })
  .build();

/**
 * Phone number validator tool
 */
export const phoneValidator = toolBuilder()
  .name('phone-validator')
  .description('Validate if a string is a valid phone number format. Supports various international formats.')
  .category(ToolCategory.UTILITY)
  .tags(['validation', 'phone', 'validate'])
  .schema(z.object({
    phone: z.string().describe('Phone number to validate'),
    strict: z.boolean().default(false).describe('Use strict validation (requires country code)'),
  }))
  .implement(async (input) => {
    // Basic phone validation - matches common formats
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

/**
 * Credit card validator tool
 */
export const creditCardValidator = toolBuilder()
  .name('credit-card-validator')
  .description('Validate if a string is a valid credit card number using the Luhn algorithm.')
  .category(ToolCategory.UTILITY)
  .tags(['validation', 'credit-card', 'validate', 'luhn'])
  .schema(z.object({
    cardNumber: z.string().describe('Credit card number to validate'),
  }))
  .implement(async (input) => {
    // Remove spaces and dashes
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

/**
 * IP address validator tool
 */
export const ipValidator = toolBuilder()
  .name('ip-validator')
  .description('Validate if a string is a valid IPv4 or IPv6 address.')
  .category(ToolCategory.UTILITY)
  .tags(['validation', 'ip', 'validate', 'network'])
  .schema(z.object({
    ip: z.string().describe('IP address to validate'),
    version: z.enum(['v4', 'v6', 'any']).default('any').describe('IP version to validate against'),
  }))
  .implement(async (input) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    let valid = false;
    let detectedVersion: string | undefined;
    
    if (input.version === 'v4' || input.version === 'any') {
      if (ipv4Regex.test(input.ip)) {
        // Additional check for valid ranges (0-255)
        const parts = input.ip.split('.');
        valid = parts.every(part => {
          const num = parseInt(part, 10);
          return num >= 0 && num <= 255;
        });
        if (valid) detectedVersion = 'IPv4';
      }
    }
    
    if (!valid && (input.version === 'v6' || input.version === 'any')) {
      if (ipv6Regex.test(input.ip)) {
        valid = true;
        detectedVersion = 'IPv6';
      }
    }
    
    return {
      valid,
      ip: input.ip,
      version: detectedVersion,
      message: valid ? `Valid ${detectedVersion} address` : 'Invalid IP address format',
    };
  })
  .build();

/**
 * UUID validator tool
 */
export const uuidValidator = toolBuilder()
  .name('uuid-validator')
  .description('Validate if a string is a valid UUID (v1, v3, v4, or v5).')
  .category(ToolCategory.UTILITY)
  .tags(['validation', 'uuid', 'validate', 'guid'])
  .schema(z.object({
    uuid: z.string().describe('UUID to validate'),
  }))
  .implement(async (input) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const valid = uuidRegex.test(input.uuid);
    
    let version: number | undefined;
    if (valid) {
      version = parseInt(input.uuid[14], 10);
    }
    
    return {
      valid,
      uuid: input.uuid,
      version,
      message: valid ? `Valid UUID v${version}` : 'Invalid UUID format',
    };
  })
  .build();

