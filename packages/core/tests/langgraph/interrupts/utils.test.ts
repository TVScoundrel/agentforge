import { describe, it, expect } from 'vitest';
import {
  createHumanRequestInterrupt,
  createApprovalRequiredInterrupt,
  createCustomInterrupt,
  isHumanRequestInterrupt,
  isApprovalRequiredInterrupt,
  isCustomInterrupt,
  getThreadStatus,
} from '../../../src/langgraph/interrupts/utils.js';
import type { HumanRequest } from '../../../src/tools/builtin/ask-human/types.js';

describe('Interrupt Utilities', () => {
  describe('createHumanRequestInterrupt', () => {
    it('should create a human request interrupt', () => {
      const humanRequest: HumanRequest = {
        id: 'req-123',
        question: 'Should I proceed?',
        priority: 'high',
        createdAt: Date.now(),
        timeout: 0,
        status: 'pending',
      };

      const interrupt = createHumanRequestInterrupt(humanRequest);

      expect(interrupt.type).toBe('human_request');
      expect(interrupt.id).toBe('req-123');
      expect(interrupt.data).toEqual(humanRequest);
      expect(interrupt.createdAt).toBe(humanRequest.createdAt);
    });
  });

  describe('createApprovalRequiredInterrupt', () => {
    it('should create an approval required interrupt', () => {
      const interrupt = createApprovalRequiredInterrupt(
        'delete-database',
        'Delete production database',
        { database: 'prod-db-1' }
      );

      expect(interrupt.type).toBe('approval_required');
      expect(interrupt.id).toMatch(/^approval-/);
      expect(interrupt.data.action).toBe('delete-database');
      expect(interrupt.data.description).toBe('Delete production database');
      expect(interrupt.data.context).toEqual({ database: 'prod-db-1' });
      expect(interrupt.createdAt).toBeGreaterThan(0);
    });

    it('should work without context', () => {
      const interrupt = createApprovalRequiredInterrupt(
        'send-email',
        'Send email to all users'
      );

      expect(interrupt.type).toBe('approval_required');
      expect(interrupt.data.action).toBe('send-email');
      expect(interrupt.data.context).toBeUndefined();
    });
  });

  describe('createCustomInterrupt', () => {
    it('should create a custom interrupt', () => {
      const customData = { type: 'review', content: 'Please review this' };
      const metadata = { reviewer: 'john@example.com' };

      const interrupt = createCustomInterrupt('custom-123', customData, metadata);

      expect(interrupt.type).toBe('custom');
      expect(interrupt.id).toBe('custom-123');
      expect(interrupt.data).toEqual(customData);
      expect(interrupt.metadata).toEqual(metadata);
      expect(interrupt.createdAt).toBeGreaterThan(0);
    });

    it('should work without metadata', () => {
      const interrupt = createCustomInterrupt('custom-456', { foo: 'bar' });

      expect(interrupt.type).toBe('custom');
      expect(interrupt.metadata).toBeUndefined();
    });
  });

  describe('Type guards', () => {
    it('isHumanRequestInterrupt should identify human request interrupts', () => {
      const humanRequest: HumanRequest = {
        id: 'req-123',
        question: 'Test?',
        priority: 'normal',
        createdAt: Date.now(),
        timeout: 0,
        status: 'pending',
      };

      const interrupt = createHumanRequestInterrupt(humanRequest);
      expect(isHumanRequestInterrupt(interrupt)).toBe(true);
      expect(isApprovalRequiredInterrupt(interrupt)).toBe(false);
      expect(isCustomInterrupt(interrupt)).toBe(false);
    });

    it('isApprovalRequiredInterrupt should identify approval interrupts', () => {
      const interrupt = createApprovalRequiredInterrupt('action', 'description');
      
      expect(isApprovalRequiredInterrupt(interrupt)).toBe(true);
      expect(isHumanRequestInterrupt(interrupt)).toBe(false);
      expect(isCustomInterrupt(interrupt)).toBe(false);
    });

    it('isCustomInterrupt should identify custom interrupts', () => {
      const interrupt = createCustomInterrupt('id', { data: 'test' });
      
      expect(isCustomInterrupt(interrupt)).toBe(true);
      expect(isHumanRequestInterrupt(interrupt)).toBe(false);
      expect(isApprovalRequiredInterrupt(interrupt)).toBe(false);
    });
  });

  describe('getThreadStatus', () => {
    it('should return "error" when hasError is true', () => {
      expect(getThreadStatus(false, false, true)).toBe('error');
      expect(getThreadStatus(true, false, true)).toBe('error');
      expect(getThreadStatus(false, true, true)).toBe('error');
    });

    it('should return "completed" when isComplete is true and no error', () => {
      expect(getThreadStatus(false, true, false)).toBe('completed');
      expect(getThreadStatus(true, true, false)).toBe('completed');
    });

    it('should return "interrupted" when hasInterrupts is true and not complete/error', () => {
      expect(getThreadStatus(true, false, false)).toBe('interrupted');
    });

    it('should return "running" when no special conditions', () => {
      expect(getThreadStatus(false, false, false)).toBe('running');
    });
  });
});

