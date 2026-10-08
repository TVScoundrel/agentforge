/** Private failure policy for Relational Mutations; adapters own execution and responses. */
type MutationOperation = 'insert' | 'update' | 'delete';

interface FailurePolicy {
  validation: readonly string[];
  constraints: readonly { pattern: RegExp; message: string }[];
  executorMessage: string;
  toolMessage: string;
  safePrefix: string | null;
}

const policies: Record<MutationOperation, FailurePolicy> = {
  insert: {
    validation: [
      'must not be empty',
      'contains invalid characters',
      'must be an object',
      'must not be an empty array',
      'must not be undefined',
      'idColumn can only be provided',
      'Returning full rows is not supported for mysql',
      'Batch INSERT with only DEFAULT VALUES is not supported',
    ],
    constraints: [
      {
        pattern: /(unique constraint|duplicate key|duplicate entry)/i,
        message: 'Insert failed: unique constraint violation.',
      },
      {
        pattern: /(foreign key constraint|violates foreign key constraint)/i,
        message: 'Insert failed: foreign key constraint violation.',
      },
      {
        pattern: /(not null constraint|cannot be null)/i,
        message: 'Insert failed: NOT NULL constraint violation.',
      },
    ],
    executorMessage: 'INSERT query failed. See logs for details.',
    toolMessage:
      'Failed to execute INSERT query. Please verify your input and database connection.',
    safePrefix: null,
  },
  update: {
    validation: [
      'must not be empty',
      'contains invalid characters',
      'Update data must be an object',
      'Update data must not be empty',
      'must not be undefined',
      'WHERE conditions are required for UPDATE queries',
      'null is only allowed with isNull/isNotNull operators',
      'operator requires a string or number value',
      'operator requires a non-empty array value',
      'operator requires a string value',
      'must not include value',
      'Optimistic lock expectedValue must not be empty',
      'optimistic lock check failed',
      'WHERE conditions are required unless allowFullTableUpdate is true',
    ],
    constraints: [
      {
        pattern: /(unique constraint|duplicate key|duplicate entry)/i,
        message: 'Update failed: unique constraint violation.',
      },
      {
        pattern: /(foreign key constraint|violates foreign key constraint)/i,
        message: 'Update failed: foreign key constraint violation.',
      },
      {
        pattern: /(not null constraint|cannot be null)/i,
        message: 'Update failed: NOT NULL constraint violation.',
      },
    ],
    executorMessage: 'UPDATE query failed. See logs for details.',
    toolMessage:
      'Failed to execute UPDATE query. Please verify your input and database connection.',
    safePrefix: null,
  },
  delete: {
    validation: [
      'must not be empty',
      'contains invalid characters',
      'WHERE conditions are required for DELETE queries',
      'WHERE conditions are required unless allowFullTableDelete is true',
      'value is required for this operator',
      'null is only allowed with isNull/isNotNull operators',
      'operator requires a value',
      'operator requires a string or number value',
      'operator requires a string value',
      'operator requires a non-empty array value',
      'must not include value',
    ],
    constraints: [
      {
        pattern:
          /(foreign key constraint|violates foreign key constraint|foreign key mismatch|a foreign key constraint fails)/i,
        message: 'Delete failed: foreign key constraint violation.',
      },
    ],
    executorMessage: 'DELETE query failed. See logs for details.',
    toolMessage:
      'Failed to execute DELETE query. Please verify your input and database connection.',
    safePrefix: 'Delete failed:',
  },
};

function isValidationFailure(policy: FailurePolicy, error: Error): boolean {
  return policy.validation.some((pattern) => error.message.includes(pattern));
}

function constraintMessage(policy: FailurePolicy, error: Error): string | undefined {
  // Drizzle wraps driver errors: inspect the outer Error and exactly one Error cause.
  const messages = [error.message];
  if (error.cause instanceof Error) {
    messages.push(error.cause.message);
  }
  // Pattern priority wins over whether the match is on the outer Error or its cause.
  return policy.constraints.find((entry) => messages.some((message) => entry.pattern.test(message)))
    ?.message;
}

/** Translate an executor failure, retaining validation identity and the original cause. */
export function translateMutationFailure(
  operation: MutationOperation,
  error: unknown,
  cascade = false
): Error {
  const policy = policies[operation];
  if (error instanceof Error) {
    const message = constraintMessage(policy, error);
    if (message) {
      const guidance =
        operation === 'delete' && cascade
          ? ' Verify database-level ON DELETE CASCADE is configured for related foreign keys.'
          : '';
      return new Error(message + guidance, { cause: error });
    }
    if (isValidationFailure(policy, error)) {
      return error;
    }
  }
  return new Error(policy.executorMessage, { cause: error });
}

/** Select the established safe or opaque message without constructing a Tool response. */
export function mutationToolFailureMessage(operation: MutationOperation, error: unknown): string {
  const policy = policies[operation];
  if (
    error instanceof Error &&
    (isValidationFailure(policy, error) ||
      (policy.safePrefix !== null
        ? error.message.startsWith(policy.safePrefix)
        : constraintMessage(policy, error) !== undefined))
  ) {
    return error.message;
  }
  return policy.toolMessage;
}

/** Preserve raw UPDATE/DELETE per-operation batch failure text. */
export function mutationBatchFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
