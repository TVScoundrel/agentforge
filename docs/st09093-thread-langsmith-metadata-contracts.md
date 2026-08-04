# ST-09093: Harden Thread and LangSmith Metadata Contracts

## Summary

Thread persistence and LangSmith observability metadata now use the shared `JsonObject` contract instead of `Record<string, any>`. This keeps metadata unknown-first and JSON-safe at the public boundary while preserving the existing passthrough behavior.

## Implementation

- Reused `JsonObject` for `ThreadConfig`, `ConversationConfig`, `LangSmithConfig`, and `TracingOptions` metadata.
- Preserved nested values and null-prototype metadata maps without cloning in direct thread and LangSmith configuration paths.
- Omitted empty or absent `sessionId` from generated conversation metadata and used the same non-empty condition for thread ID derivation.
- Added compile-time coverage rejecting functions, `Date` instances, and other non-JSON metadata values.

## Test Strategy

Focused runtime coverage was added before the production type change and passed against the existing implementation. Compile-time assertions then failed as expected because the original `any` signatures accepted non-JSON values. The production contract change was applied only after that failing typecheck evidence, followed by focused typecheck and runtime validation.

## Compatibility Notes

- Existing JSON-safe metadata remains accepted and is passed through unchanged.
- Omitted or empty optional metadata and `sessionId` remain omitted rather than becoming `undefined` properties.
- LangSmith environment configuration and tracing execution behavior are unchanged.
- No CI workflow change is required because existing package, workspace, typecheck, lint, and explicit-`any` gates cover the changed contracts.
