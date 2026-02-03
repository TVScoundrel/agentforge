/**
 * Validation Tools - Type Definitions
 */

import { z } from 'zod';

/**
 * Schema for email validator tool
 */
export const EmailValidatorSchema = z.object({
  email: z.string().describe('Email address to validate'),
});

/**
 * Schema for URL validator tool
 */
export const UrlValidatorSimpleSchema = z.object({
  url: z.string().describe('URL to validate'),
});

/**
 * Schema for phone validator tool
 */
export const PhoneValidatorSchema = z.object({
  phone: z.string().describe('Phone number to validate'),
  strict: z.boolean().default(false).describe('Use strict validation (requires country code)'),
});

/**
 * Schema for credit card validator tool
 */
export const CreditCardValidatorSchema = z.object({
  cardNumber: z.string().describe('Credit card number to validate'),
});

/**
 * Schema for IP validator tool
 */
export const IpValidatorSchema = z.object({
  ip: z.string().describe('IP address to validate'),
  version: z.enum(['v4', 'v6', 'any']).default('any').describe('IP version to validate against'),
});

/**
 * Schema for UUID validator tool
 */
export const UuidValidatorSchema = z.object({
  uuid: z.string().describe('UUID to validate'),
});

/**
 * Configuration for validation tools
 */
export interface ValidationConfig {
  // Future: Add configuration options if needed
}

export type EmailValidatorInput = z.infer<typeof EmailValidatorSchema>;
export type UrlValidatorSimpleInput = z.infer<typeof UrlValidatorSimpleSchema>;
export type PhoneValidatorInput = z.infer<typeof PhoneValidatorSchema>;
export type CreditCardValidatorInput = z.infer<typeof CreditCardValidatorSchema>;
export type IpValidatorInput = z.infer<typeof IpValidatorSchema>;
export type UuidValidatorInput = z.infer<typeof UuidValidatorSchema>;

