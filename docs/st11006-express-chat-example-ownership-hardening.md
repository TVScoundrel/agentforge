# ST-11006: Express Chat Example Ownership Hardening

## Decision

The example now requires a non-empty `X-Demo-User-Id` header on every chat endpoint and stores conversations under that owner scope. Missing owner identity returns `401`; cross-owner history reads and deletes behave like missing conversations instead of revealing another owner’s data.

The header is an example-only ownership boundary, not authentication. The README instructs adopters to replace it with an identity established by their verified application authentication layer before exposing the API to users.

## Test Strategy

The example had no HTTP test harness, so focused unit coverage was added around the extracted owner-scoped conversation store and owner-header normalization. Coverage verifies blank-owner rejection, cross-owner isolation, owner-scoped listing, and owner-scoped deletion.

## Compatibility

This is intentionally scoped to the Express example. Existing framework APIs are unchanged, while callers of the example chat routes must now provide the documented demo owner header.

## Validation

- `pnpm --dir examples/integrations/express-api test` -> passed, 3 tests.
- Standalone example typecheck remains blocked by the example not being part of `pnpm-workspace.yaml`; its dependencies (`express`, LangChain, AgentForge workspace packages, and Zod) are not installed in the example checkout.
- No CI change is required; the example-local test script provides the focused regression command and the repository-wide gates remain the canonical final validation.
