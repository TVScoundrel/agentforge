import { describe, it, expect } from 'vitest';
import { presets, production, development, testing } from '../../presets.js';

describe('Middleware Presets', () => {
  describe('presets object', () => {
    it('should export all presets', () => {
      expect(presets.production).toBe(production);
      expect(presets.development).toBe(development);
      expect(presets.testing).toBe(testing);
    });
  });
});
