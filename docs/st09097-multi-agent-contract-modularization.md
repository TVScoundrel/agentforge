# ST-09097: Multi-Agent Contract Modularization

`packages/patterns/src/multi-agent/types.ts` remains the stable import path, but now serves as a type-only facade over focused supervisor, worker, aggregator/system, and routing contract modules. The split keeps domain-specific declarations reviewable while preserving the existing multi-agent and package-root exports.

The source-included contract check now imports representative compile-time assertions from matching focused modules under `packages/patterns/tests/multi-agent/contracts/`. Runtime multi-agent suites remain unchanged and provide compatibility evidence for consumers of these types.

## Validation

- `pnpm --filter @agentforge/patterns typecheck` passed before and after the production split.
- `pnpm --filter @agentforge/patterns test --run` passed: 34 files and 301 tests.
- No CI changes are required; the existing package typecheck, patterns tests, workspace lint, and release validation paths cover this type-only refactor.
