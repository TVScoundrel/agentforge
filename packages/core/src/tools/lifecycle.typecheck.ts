import {
  createManagedTool,
  type ToolHealthCheckResult,
} from './lifecycle.js';

const managedTool = createManagedTool<
  { requestId: string },
  { count: number },
  { doubled: number; requestId: string }
>({
  name: 'managed-tool',
  description: 'Lifecycle typecheck fixture',
  context: {
    requestId: 'req-123',
  },
  initialize: async function () {
    if (!this.context) {
      throw new Error('Context missing');
    }

    const requestId: string = this.context.requestId;
    void requestId;
  },
  execute: async function (input: { count: number }) {
    if (!this.context) {
      throw new Error('Context missing');
    }

    return {
      doubled: input.count * 2,
      requestId: this.context.requestId,
    };
  },
  healthCheck: async () => ({
    healthy: true,
    metadata: {
      status: 'ready',
      counts: [1, 2, 3],
    },
  }),
});

void managedTool.toLangChainTool().invoke({ count: 2 }).then((result) => {
  const doubled: number = result.doubled;
  const requestId: string = result.requestId;
  void doubled;
  void requestId;
});

const explicitHealthResult: ToolHealthCheckResult = {
  healthy: true,
  metadata: {
    message: 'ok',
    nested: {
      attempts: 1,
    },
  },
};

void explicitHealthResult;

const unknownTool = createManagedTool({
  name: 'unknown-tool',
  description: 'Unknown defaults fixture',
  execute: async (input: unknown) => input,
});

void unknownTool;
