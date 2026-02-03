/**
 * IP Address Validator Tool
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { IpValidatorSchema } from '../types.js';

/**
 * Create IP validator tool
 */
export function createIpValidatorTool() {
  return toolBuilder()
    .name('ip-validator')
    .description('Validate if a string is a valid IPv4 or IPv6 address.')
    .category(ToolCategory.UTILITY)
    .tags(['validation', 'ip', 'validate', 'network'])
    .schema(IpValidatorSchema)
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
}

