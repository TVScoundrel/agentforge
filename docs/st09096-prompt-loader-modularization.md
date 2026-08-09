# ST-09096: Prompt Loader Modularization

## Scope

Split prompt contracts, variable normalization and sanitization, conditional/substitution rendering, and Markdown file loading into focused modules while retaining `prompt-loader/index.ts` as the stable public facade.

## Design

- `contracts.ts` owns the public variable and render-option contracts.
- `variables.ts` owns null-prototype variable maps, option detection, own-enumerable normalization, precedence merging, and untrusted-value sanitization.
- `renderer.ts` owns conditional evaluation and substitution while keeping raw and sanitized value paths separate.
- `file-loader.ts` owns default/custom directory resolution, synchronous Markdown loading, rendering delegation, and contextual error wrapping.
- `index.ts` re-exports the existing public API so downstream import paths remain unchanged.

## Test Strategy

This is a behavior-preserving module split, so characterization-first coverage was used instead of inventing a failing behavioral requirement. Before production changes, the public suite was split into sanitization, rendering, compatibility/security, and file-loading modules and expanded to cover missing variables, own option discriminators, default prompt-directory resolution, and wrapped missing-file errors. The 17-test characterization baseline passed against the original implementation; final post-extraction coverage has 27 tests after restoring the original cases as independently discoverable tests and retaining the additional characterizations.

## Security and Compatibility

Trusted values remain unsanitized, untrusted values remain sanitized, untrusted values override trusted values, conditional truthiness uses raw values, and substitution uses sanitized values. Variable maps use null prototypes, inherited properties remain excluded, `__proto__` remains data, malformed option maps fall back to empty maps, and backwards-compatible plain objects remain trusted.

## CI Assessment

No CI workflow change is required. Existing focused/core tests, typecheck, workspace lint, release validation, and explicit-any baseline gates cover the extracted modules and stable facade.

## Validation

- Characterization baseline: `pnpm --filter @agentforge/core test --run tests/prompt-loader/index.test.ts` — 1 file and 17 tests passed before production changes.
- Post-refactor focused validation: the same command — 1 file and 27 tests passed.
- `pnpm --filter @agentforge/core typecheck` — passed.
- `pnpm --filter @agentforge/core lint` — passed with existing warnings and zero errors.
- `pnpm --filter @agentforge/core test --run` — 67 files and 653 tests passed.
- `pnpm release:validate` — build and release validation passed; 231 test files passed, 9 skipped, 2,562 tests passed, and 110 skipped.
- `pnpm lint` — passed with existing warnings and zero errors.
- `pnpm typecheck` — passed across all packages.
- `pnpm lint:explicit-any:baseline` — passed at 45 warnings against the committed cap of 289 (`core` remained 13/119).
- `git diff --check` — passed.
