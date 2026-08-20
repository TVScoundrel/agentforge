# ST-09099: Normalize Default Node Metrics Namespaces

## Outcome

`withMetrics(...)` now sends unqualified metric suffixes to collectors it creates itself. The collector namespace supplies the node name, so default metrics are emitted as `<node>.invocations`, `<node>.success`, `<node>.errors`, and `<node>.duration`.

Callers that provide a shared collector continue to receive node-qualified suffixes, preserving distinguishability between multiple instrumented nodes under one collector namespace.

## Validation and decisions

- Test-first regression coverage was added in `packages/core/tests/langgraph/observability/default-node-instrumentation.test.ts`; the test failed before the production change with duplicated `my-node.my-node.*` output at the collector boundary.
- Existing metrics coverage continues to verify shared-collector naming, synchronous/asynchronous results, error identity and rethrow, duration tracking, and disabled tracking options.
- No CI or validation automation change is required; the existing core test, typecheck, lint, baseline, and workspace test commands cover this behavior.
