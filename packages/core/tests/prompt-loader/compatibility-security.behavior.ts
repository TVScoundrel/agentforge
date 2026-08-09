import { describe, expect, it } from 'vitest';
import { renderTemplate } from '../../src/prompt-loader/index.js';

export function runCompatibilitySecurityTests(): void {
  describe('compatibility and prototype safety', () => {
    it('treats backwards-compatible plain objects as trusted', () => {
      expect(renderTemplate('Instructions:\n{{instructions}}', {
        instructions: 'Line 1\nLine 2',
      })).toBe('Instructions:\nLine 1\nLine 2');
    });

    it('falls back to empty maps for malformed option values', () => {
      const options = { trustedVariables: 'invalid', untrustedVariables: 42 } as unknown as Parameters<
        typeof renderTemplate
      >[1];
      expect(renderTemplate('Trusted: {{trusted}}\nUntrusted: {{untrusted}}', options)).toBe(
        'Trusted: \nUntrusted: '
      );
    });

    it('considers only own enumerable properties', () => {
      const variables = Object.create({ inherited: 'prototype' }) as Record<string, unknown>;
      variables.own = 'value';
      expect(renderTemplate('{{own}}/{{inherited}}', variables)).toBe('value/');
    });

    it('treats __proto__ as data without mutating prototypes', () => {
      const variables = JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>;
      expect(renderTemplate('Key: {{__proto__}}', { untrustedVariables: variables })).toBe(
        'Key: [object Object]'
      );
      expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });

    it('recognizes only own option discriminator properties', () => {
      const variables = Object.create({ trustedVariables: { hidden: 'value' } }) as Record<string, unknown>;
      variables.visible = 'shown';
      expect(renderTemplate('{{visible}}/{{hidden}}', variables)).toBe('shown/');
    });
  });
}
