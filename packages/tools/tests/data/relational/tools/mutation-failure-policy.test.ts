import { describe, expect, it } from 'vitest';
import {
  mutationBatchFailureMessage,
  mutationToolFailureMessage,
  translateMutationFailure,
} from '../../../../src/data/relational/tools/mutation-failure-policy.js';
/** Existing error-utility behavioral examples, retained as policy test fixtures. */
const mutationValidationCases = {
  insert: [
    'Table name must not be empty',
    'Column contains invalid characters',
    'Insert row at index 0 must be an object',
    'Insert data must not be an empty array',
    'Value must not be undefined',
    'idColumn can only be provided when mode is id',
    'Returning full rows is not supported for mysql',
    'Batch INSERT with only DEFAULT VALUES is not supported',
  ],
  update: [
    'Table name must not be empty',
    'Identifier contains invalid characters',
    'Update data must be an object',
    'Update data must not be empty',
    'Value must not be undefined',
    'WHERE conditions are required for UPDATE queries',
    'null is only allowed with isNull/isNotNull operators',
    'operator requires a string or number value',
    'operator requires a non-empty array value',
    'operator requires a string value',
    'isNull must not include value',
    'Optimistic lock expectedValue must not be empty',
    'optimistic lock check failed',
    'WHERE conditions are required unless allowFullTableUpdate is true',
  ],
  delete: [
    'Table name must not be empty',
    'Identifier contains invalid characters',
    'WHERE conditions are required for DELETE queries',
    'WHERE conditions are required unless allowFullTableDelete is true',
    'value is required for this operator',
    'null is only allowed with isNull/isNotNull operators',
    'operator requires a value',
    'operator requires a string or number value',
    'operator requires a string value',
    'operator requires a non-empty array value',
    'isNull must not include value',
  ],
};

const operations = ['insert', 'update', 'delete'] as const;
const opaqueExecutor = {
  insert: 'INSERT query failed. See logs for details.',
  update: 'UPDATE query failed. See logs for details.',
  delete: 'DELETE query failed. See logs for details.',
};
const opaqueTool = {
  insert: 'Failed to execute INSERT query. Please verify your input and database connection.',
  update: 'Failed to execute UPDATE query. Please verify your input and database connection.',
  delete: 'Failed to execute DELETE query. Please verify your input and database connection.',
};

const constraints = [
  ['unique constraint', 'unique constraint violation.'],
  ['duplicate key', 'unique constraint violation.'],
  ["Duplicate entry '1' for key 'PRIMARY'", 'unique constraint violation.'],
  ['foreign key constraint', 'foreign key constraint violation.'],
  ['violates foreign key constraint', 'foreign key constraint violation.'],
  ['not null constraint', 'NOT NULL constraint violation.'],
  ["Column 'name' cannot be null", 'NOT NULL constraint violation.'],
] as const;

describe.each(operations)('%s mutation failure policy', (operation) => {
  it.each(mutationValidationCases[operation])(
    'retains validation identity and exposes %s',
    (message) => {
      const error = new Error(`prefix: ${message} (suffix)`, {
        cause: new Error('original cause'),
      });
      expect(translateMutationFailure(operation, error)).toBe(error);
      expect(mutationToolFailureMessage(operation, error)).toBe(error.message);
    }
  );

  it.each(mutationValidationCases[operation])(
    'keeps validation matching case sensitive for %s',
    (message) => {
      const error = new Error(message.toUpperCase());
      expect(translateMutationFailure(operation, error)).toMatchObject({
        message: opaqueExecutor[operation],
        cause: error,
      });
      expect(mutationToolFailureMessage(operation, error)).toBe(opaqueTool[operation]);
    }
  );

  it.each([
    'string',
    'foreign key constraint',
    42,
    null,
    undefined,
    { message: 'Table name must not be empty' },
    { message: 'foreign key constraint', cause: new Error('duplicate key') },
    new Error('Connection refused'),
    new Error('timeout exceeded'),
    new Error('connection reset'),
    new Error('wrapper', { cause: new Error('Table name must not be empty') }),
    new Error('wrapper', { cause: { message: 'foreign key constraint' } }),
    new Error('wrapper', {
      cause: new Error('inner', { cause: new Error('foreign key constraint') }),
    }),
  ])('keeps unknown errors opaque without inspecting objects or deeper causes (%#)', (error) => {
    const translated = translateMutationFailure(operation, error);
    expect(translated).toBeInstanceOf(Error);
    expect(translated.message).toBe(opaqueExecutor[operation]);
    expect(translated.cause).toBe(error);
    expect(mutationToolFailureMessage(operation, error)).toBe(opaqueTool[operation]);
  });

  it('prioritizes direct-cause constraints over outer validation', () => {
    const error = new Error('Table name must not be empty', {
      cause: new Error('foreign key constraint'),
    });
    const translated = translateMutationFailure(operation, error);
    expect(translated).not.toBe(error);
    expect(translated.message).toBe(
      {
        insert: 'Insert failed: foreign key constraint violation.',
        update: 'Update failed: foreign key constraint violation.',
        delete: 'Delete failed: foreign key constraint violation.',
      }[operation]
    );
    expect(translated.cause).toBe(error);
    expect(mutationToolFailureMessage(operation, error)).toBe(error.message);
  });

  it('does not expose opaque executor translations at the Tool boundary', () => {
    expect(
      mutationToolFailureMessage(
        operation,
        translateMutationFailure(operation, new Error('secret'))
      )
    ).toBe(opaqueTool[operation]);
  });
});

describe.each(['insert', 'update'] as const)(
  '%s constraint translation and exposure',
  (operation) => {
    const prefix = operation === 'insert' ? 'Insert failed: ' : 'Update failed: ';
    it.each(constraints)(
      'recognizes %s on outer Errors or direct Error causes, regardless of case',
      (message, suffix) => {
        for (const error of [
          new Error(message.toUpperCase()),
          new Error('driver wrapper', { cause: new Error(message.toUpperCase()) }),
        ]) {
          const translated = translateMutationFailure(operation, error);
          expect(translated.message).toBe(prefix + suffix);
          expect(translated.cause).toBe(error);
          // Preserve raw outer text for Tool selection; the executor owns sanitization.
          expect(mutationToolFailureMessage(operation, error)).toBe(error.message);
          expect(mutationToolFailureMessage(operation, translated)).toBe(prefix + suffix);
        }
      }
    );

    it.each([
      [
        'foreign key constraint; duplicate key; cannot be null',
        undefined,
        'unique constraint violation.',
      ],
      ['foreign key constraint', 'duplicate key', 'unique constraint violation.'],
      ['duplicate key', 'foreign key constraint', 'unique constraint violation.'],
      ['cannot be null', 'foreign key constraint', 'foreign key constraint violation.'],
      ['foreign key constraint', 'cannot be null', 'foreign key constraint violation.'],
    ])(
      'retains constraint pattern priority across outer and cause (%#)',
      (message, cause, suffix) => {
        const error = new Error(message, { cause: cause ? new Error(cause) : undefined });
        const translated = translateMutationFailure(operation, error);
        expect(translated.message).toBe(prefix + suffix);
        expect(translated.cause).toBe(error);
      }
    );

    it.each(
      operation === 'insert'
        ? ['foreign key mismatch', 'Delete failed: arbitrary text']
        : ['foreign key mismatch', 'must be an object', 'Delete failed: arbitrary text']
    )('keeps operation-specific unmatched messages opaque: %s', (message) => {
      expect(translateMutationFailure(operation, new Error(message)).message).toBe(
        opaqueExecutor[operation]
      );
      expect(mutationToolFailureMessage(operation, new Error(message))).toBe(opaqueTool[operation]);
    });
  }
);

describe('DELETE-specific constraints, cascade guidance, and exposure', () => {
  it.each([
    'foreign key constraint',
    'violates foreign key constraint',
    'foreign key mismatch',
    'a foreign key constraint fails',
  ])('recognizes %s in outer or direct cause with conditional cascade guidance', (message) => {
    for (const error of [
      new Error(message.toUpperCase()),
      new Error('driver wrapper', { cause: new Error(message.toUpperCase()) }),
    ]) {
      expect(mutationToolFailureMessage('delete', error)).toBe(opaqueTool.delete);
      for (const cascade of [false, true]) {
        const translated = translateMutationFailure('delete', error, cascade);
        expect(translated.message).toBe(
          cascade
            ? 'Delete failed: foreign key constraint violation. Verify database-level ON DELETE CASCADE is configured for related foreign keys.'
            : 'Delete failed: foreign key constraint violation.'
        );
        expect(translated.cause).toBe(error);
        expect(mutationToolFailureMessage('delete', translated)).toBe(translated.message);
      }
    }
  });

  it.each([
    'unique constraint',
    'duplicate key',
    'duplicate entry',
    'not null constraint',
    'cannot be null',
  ])('does not classify %s', (message) => {
    for (const error of [new Error(message), new Error('wrapper', { cause: new Error(message) })]) {
      expect(translateMutationFailure('delete', error, true).message).toBe(opaqueExecutor.delete);
      expect(mutationToolFailureMessage('delete', error)).toBe(opaqueTool.delete);
    }
  });

  it('exposes an exact safe prefix without treating it as executor validation', () => {
    const error = new Error('Delete failed: arbitrary detail');
    expect(mutationToolFailureMessage('delete', error)).toBe('Delete failed: arbitrary detail');
    expect(translateMutationFailure('delete', error).message).toBe(opaqueExecutor.delete);
  });

  it.each([
    'delete failed: arbitrary detail',
    'prefix Delete failed: arbitrary detail',
    'Update data must be an object',
  ])('requires the case-sensitive prefix or DELETE validation: %s', (message) => {
    expect(mutationToolFailureMessage('delete', new Error(message))).toBe(opaqueTool.delete);
  });

  it.each([
    'GT operator requires a string or number value for column age',
    'EQ operator requires a value for column id',
  ])('retains query-builder validation coverage: %s', (message) => {
    const error = new Error(message);
    expect(translateMutationFailure('delete', error)).toBe(error);
    expect(mutationToolFailureMessage('delete', error)).toBe(message);
  });
});

describe('mutation batch failure text', () => {
  it.each([
    [new Error('raw driver error'), 'raw driver error'],
    ['string failure', 'string failure'],
    [42, '42'],
    [null, 'null'],
    [undefined, 'undefined'],
    [{ message: 'ignored' }, '[object Object]'],
    [{ toString: () => 'custom failure' }, 'custom failure'],
  ])('preserves Error.message or String(value) (%#)', (error, expected) => {
    expect(mutationBatchFailureMessage(error)).toBe(expected);
  });
});
