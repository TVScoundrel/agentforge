# ST-09009: Ask-Human Interrupt Boundary Hardening

## Summary

Tightened the ask-human tool's LangGraph interrupt boundary so dynamic import, interrupt lookup, and resumed response handling no longer depend on explicit `any` casts.

## What Changed

| File | Change |
|------|--------|
| `packages/tools/src/agent/ask-human/tool.ts` | Added `unknown`-based LangGraph module guards, centralized interrupt loading, preserved clear dependency/version errors, and normalized resumed responses to keep `AskHumanOutput.response` strictly typed as `string`. |
| `packages/tools/tests/agent/ask-human-boundary.test.ts` | Added focused interrupt-boundary tests for missing LangGraph handling, missing `interrupt` export compatibility, successful string resume behavior, and timeout/default-response fallback. |
| `packages/tools/tests/agent/ask-human.test.ts` | Removed stale unused Vitest imports exposed while tightening the focused lint scope. |

## Explicit-`any` Delta

- `packages/tools/src/agent/ask-human/tool.ts`: `3 -> 0`
- Workspace baseline: `295 -> 292`
- `tools`: `70 -> 67`

## Validation Performed

```bash
pnpm exec tsc -p packages/tools/tsconfig.json --noEmit
pnpm exec eslint packages/tools/src/agent/ask-human/tool.ts packages/tools/tests/agent/ask-human-boundary.test.ts packages/tools/tests/agent/ask-human.test.ts
pnpm test --run packages/tools/tests/agent/ask-human.test.ts packages/tools/tests/agent/ask-human-boundary.test.ts packages/tools/tests/agent/ask-human-react.integration.test.ts packages/tools/tests/agent/ask-human-plan-execute.integration.test.ts
```

Focused test result:
- `4` files passed
- `32` tests passed

## Status

In progress on `codex/fix/st-09009-ask-human-interrupt-boundary-hardening`.
