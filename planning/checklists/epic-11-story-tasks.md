# Epic 11: Security Boundary Hardening - Story Tasks

## ST-11001: Publish Repository Security Boundary Policy

**Branch:** `docs/st-11001-repository-security-boundary-policy`

### Checklist
- [x] Create branch `docs/st-11001-repository-security-boundary-policy`
  - Created on 2026-07-14 from `main`.
- [x] Create draft PR with story ID in title
  - Draft PR #158 created on 2026-07-14: <https://github.com/TVScoundrel/agentforge/pull/158>
- [x] Define test strategy before implementation: identify whether this policy/docs hardening story has a practical failing automated test seam or should rely on documented rationale plus validation commands
  - Strategy: this is a repository-policy and docs-routing story with no practical red-test seam, so record the rationale up front and rely on targeted diff review plus the repo's standard full-suite and lint gates.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - No practical failing automated test exists because the story changes policy text and security-routing guidance rather than runtime behavior or a tested docs-build transform.
- [x] Add a top-level `SECURITY.md` that documents supported versions, reporting guidance, and the repository trust boundaries for tools, skills, examples, and downstream host applications
  - Existing tracked `SECURITY.md` already satisfied this baseline on `main` from commit `b7f53f02` (`docs(ep-11): add security policy and hardening backlog`); this story keeps that file as the canonical policy baseline.
- [x] Explicitly distinguish privileged-by-design surfaces from framework guarantees intended to be safe for model-controlled input
  - Confirmed in `SECURITY.md` under `Privileged-by-Design Surfaces` and `Framework Guardrails Expected by Default`.
- [x] Cross-link security-relevant docs to the new policy where that guidance materially affects safe adoption
  - Added links from `README.md`, `docs-site/contributing.md`, `docs-site/guide/concepts/tools.md`, `docs-site/guide/agent-skills.md`, and `docs-site/guide/agent-skills-authoring.md`.
- [x] Include maintainer guidance for classifying example-only issues, untrusted skill roots, and model-exposed tool execution
  - Confirmed in `SECURITY.md` under `Framework Packages vs Example Applications`, `Out of Scope`, and `Disclosure Expectations`.
- [x] Add/update production docs until focused validation passes, keeping evidence in checklist notes and PR body
  - Updated the maintainer/adopter docs above to route security-sensitive usage to the repository policy before exposing privileged surfaces to model-controlled input.
- [x] Add or update story documentation at `docs/st11001-repository-security-boundary-policy.md` (or document why not required)
  - Added `docs/st11001-repository-security-boundary-policy.md`.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - No additional automated tests are required because the story does not alter runtime behavior; the residual validation need is covered by full-suite and lint verification.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the story changes policy/docs only and does not introduce a new validation contract beyond the existing repo-wide test and lint commands.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `224` passed, `9` skipped files; `2498` passed, `110` skipped tests.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with the existing warning baseline only (`0` errors).
- [x] Commit completed checklist items as logical commits and push updates
  - `91933602` `docs(st-11001): publish security policy guidance` pushed to `origin/docs/st-11001-repository-security-boundary-policy`; tracker and ready-state sync are captured in the current review-prep follow-up commit.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #158 marked ready for review on 2026-07-14 after docs updates, story documentation, validation, PR body verification, and tracker sync were complete.
- [x] Wait for merge; do not merge directly from local branch
  - PR #158 merged into `main` on 2026-07-15 as commit `20246a4b`; post-merge tracker sync and queue grooming completed from local `main`.

## ST-11004: Separate Worker Output from Supervisor Routing Input

**Branch:** `feat/st-11004-worker-routing-boundary`

### Checklist
- [x] Create branch `feat/st-11004-worker-routing-boundary`
  - Created on 2026-07-16 from `main` after moving `ST-11004` to `In Progress` in `planning/kanban-queue.md`.
- [x] Create draft PR with story ID in title
  - Draft PR #159 created on 2026-07-16: <https://github.com/TVScoundrel/agentforge/pull/159>
- [x] Define test strategy before implementation: identify the practical failing automated test seam for worker-output prompt injection and supervisor-routing boundary separation
  - Strategy: use focused red/green routing regressions around `packages/patterns/src/multi-agent/routing-internal/llm-routing.ts` and `packages/patterns/src/multi-agent/nodes/supervisor.ts` because this story changes framework routing behavior with a practical unit-test seam.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - Added injection-focused regressions in `packages/patterns/tests/multi-agent/routing-llm.test.ts` and `packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts`, then captured the expected red failure from `pnpm --filter @agentforge/patterns test --run packages/patterns/tests/multi-agent/routing-llm.test.ts packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts` because the supervisor prompt still used injected worker-result text as `Current task`.
- [x] Identify the current supervisor-routing prompt path that reuses worker output and document the intended boundary/transform seam
  - Confirmed the vulnerable path in `packages/patterns/src/multi-agent/routing-internal/llm-routing.ts` and `packages/patterns/src/multi-agent/nodes/shared.ts`, where the latest message content was reused directly; the replacement seam now anchors to trusted `supervisorTask` intent and reintroduces worker results only through labeled untrusted-context formatting.
- [x] Update the multi-agent state model so worker-result context remains available without reusing raw worker free-form output as direct supervisor routing input
  - Added optional `supervisorTask` state support in `packages/patterns/src/multi-agent/state.ts` and taught shared helpers to preserve trusted task intent separately from `completedTasks`.
- [x] Harden supervisor routing prompt construction so worker output is treated as untrusted context instead of authoritative routing instructions
  - Updated `packages/patterns/src/multi-agent/routing-internal/llm-routing.ts` plus assignment-task generation in `packages/patterns/src/multi-agent/nodes/shared.ts` so worker results are appended only as explicitly labeled untrusted context.
- [x] Add focused regression tests covering prompt-injection-style worker output that attempts to rewrite routing instructions or escalate authority
  - Added focused regressions for injected worker-result text in `packages/patterns/tests/multi-agent/routing-llm.test.ts` and `packages/patterns/tests/multi-agent/nodes/supervisor-routing.ts`; follow-up validation also passed in `packages/patterns/tests/multi-agent/nodes.test.ts`, `packages/patterns/tests/multi-agent/agent-system.test.ts`, and `packages/patterns/tests/multi-agent/state.test.ts`.
- [x] Document compatibility impact for downstream applications that currently rely on raw worker-message routing behavior
  - Added compatibility notes to `packages/patterns/docs/multi-agent-pattern.md`, `packages/patterns/examples/multi-agent/README.md`, and `docs/st11004-multi-agent-routing-boundary-separation.md`.
- [x] Add or update story documentation at `docs/st11004-multi-agent-routing-boundary-separation.md` (or document why not required)
  - Added `docs/st11004-multi-agent-routing-boundary-separation.md`.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - Added the focused routing and supervisor regressions plus adjacent multi-agent suite coverage; no further automated tests are currently required beyond the pending repo-wide validation/lint gates before PR readiness.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the hardening fits the existing patterns-package and repo-wide validation commands without introducing a new automation contract.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `224` passed, `9` skipped files; `2500` passed, `110` skipped tests.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with the existing warning baseline only (`0` errors); package lint output still includes the known repo warning baseline and existing ESLint flat-config env warnings in legacy example files.
- [x] Commit completed checklist items as logical commits and push updates
  - `a826743e` `fix(st-11004): separate supervisor task intent` pushed to `origin/feat/st-11004-worker-routing-boundary`; final review-prep tracker sync is captured in the current follow-up commit.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #159 marked ready for review on 2026-07-16 after the focused regressions, repo-wide `pnpm test --run`, `pnpm lint`, checklist sync, and PR body verification all completed successfully.
- [x] Wait for merge; do not merge directly from local branch
  - PR #159 merged into `main` on 2026-07-16 as commit `7aaeb92e`; post-merge tracker sync, done-story archival, and ready-lane grooming were completed from local `main`.

## ST-11005: Enforce Trust-Aware Skill Prompt and Activation Boundaries

**Branch:** `feat/st-11005-skill-trust-boundaries`

### Checklist
- [x] Create branch `feat/st-11005-skill-trust-boundaries`
  - Created on 2026-07-17 from `main` after moving `ST-11005` to `In Progress` in `planning/kanban-queue.md`.
- [x] Create draft PR with story ID in title
  - Draft PR #160 created on 2026-07-17: <https://github.com/TVScoundrel/agentforge/pull/160>
- [x] Define test strategy before implementation: identify the practical failing automated test seam for untrusted-skill discovery, prompt generation, and activation trust handling
  - Strategy: use focused red/green regressions in `packages/skills/tests/prompt.test.ts` and `packages/skills/tests/activation/activate-skill.suite.ts`, then re-run the activation entrypoint in `packages/skills/tests/activation.test.ts` to confirm the trust-aware activation flow composes with existing resource-policy coverage.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - Added prompt and activation regressions first, then captured the expected red failures with `pnpm exec vitest --run packages/skills/tests/prompt.test.ts packages/skills/tests/activation/activate-skill.suite.ts`; initial failures confirmed untrusted skills were still emitted as ordinary `<available_skills>` entries and activation still returned full SKILL.md bodies.
- [x] Identify the current prompt-generation and activation paths that treat untrusted skill content on the same footing as trusted/workspace skills, and document the intended trust boundary
  - Confirmed the vulnerable path in `packages/skills/src/registry-prompt.ts` and `packages/skills/src/activation-activate-tool.ts`, where trust level existed for resource enforcement but not for prompt rendering or SKILL.md activation; the new boundary keeps untrusted roots discoverable while blocking full-body activation until root promotion.
- [x] Update skill prompt generation and activation flows so trust level is explicit and untrusted skill bodies are not presented to the model on the same footing as trusted/workspace skills without an explicit policy choice
  - `generatePrompt()` now separates trusted/workspace entries from discoverable `<untrusted_skills>` output, and `activate-skill` now enforces trust-aware SKILL.md activation via `evaluateSkillActivationPolicy()`.
- [x] Preserve the existing script-resource trust policy and ensure the new prompt/activation trust handling composes with it without split-brain behavior
  - Preserved `read-skill-resource` script gating and added the activation trust check alongside it so trusted/workspace roots still activate normally while untrusted roots remain blocked for both full-body activation and `scripts/` reads.
- [x] Add focused regression or conformance coverage for untrusted-skill discovery, activation behavior, and the trusted-root opt-in path
  - Added/updated focused regressions in `packages/skills/tests/prompt.test.ts`, `packages/skills/tests/activation/activate-skill.suite.ts`, and `packages/skills/tests/activation/activation-tools.suite.ts`; green validation passed with `pnpm exec vitest --run packages/skills/tests/prompt.test.ts packages/skills/tests/activation.test.ts`.
- [x] Update public docs to explain trust tradeoffs for community skill packs and the migration path for existing adopters
  - Updated `docs-site/guide/agent-skills.md`, `docs-site/guide/agent-skills-authoring.md`, and `docs-site/tutorials/skill-powered-agent.md` with the new prompt structure, activation boundary, and root-promotion migration guidance.
- [x] Add or update story documentation at `docs/st11005-skill-trust-boundary-hardening.md` (or document why not required)
  - Added `docs/st11005-skill-trust-boundary-hardening.md`.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - Added the prompt and activation regressions plus updated activation integration coverage; no additional focused automated tests are currently required beyond the pending repo-wide full-suite and lint gates.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the hardening fits the existing skills-package and repo-wide validation paths; this story adds coverage inside the current Vitest suites rather than introducing a new automation contract.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `224` passed, `9` skipped files; `2505` passed, `110` skipped tests.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with the existing warning baseline only (`0` errors); workspace lint still reports longstanding warnings and ESLint flat-config env warnings in legacy example files outside this story.
- [x] Commit completed checklist items as logical commits and push updates
  - `4a107088` `fix(st-11005): enforce skill trust boundaries` and `2877bbe0` `test(st-11005): align conformance expectations` were pushed to `origin/feat/st-11005-skill-trust-boundaries`; the final ready-state tracker sync is captured in the current follow-up commit.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #160 marked ready for review on 2026-07-17 after the conformance expectation fix, repo-wide `pnpm test --run`, `pnpm lint`, checklist sync, and PR body update were complete.
- [x] Wait for merge; do not merge directly from local branch
  - PR #160 merged into `main` on 2026-07-18 as commit `e34389a9`; post-merge tracker sync and ready-lane grooming completed from local `main`.

## ST-11002: Harden Default Web Tool Egress Policy

**Branch:** `feat/st-11002-web-egress-policy`

### Checklist
- [x] Create branch `feat/st-11002-web-egress-policy`
  - Created on 2026-07-20 from `main` after moving `ST-11002` to `In Progress` in `planning/kanban-queue.md`.
- [x] Create draft PR with story ID in title
  - Created draft PR #161: https://github.com/TVScoundrel/agentforge/pull/161
- [x] Define test strategy before implementation: identify the practical failing automated test seam for destination policy enforcement and redirect revalidation
  - Strategy: add red-first unit coverage for the shared destination classifier and request helper in `packages/tools/tests/web/egress-policy.test.ts`, using mocked Axios responses to prove initial private-target denial and redirect-bypass denial without making network requests.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - Added `packages/tools/tests/web/egress-policy.test.ts` before the production module; the red run failed because `src/web/egress-policy.ts` did not exist, then the focused green run passed after implementation.
- [x] Add a shared destination policy for HTTP and scraper tools that blocks localhost, link-local, metadata, and RFC1918/private-network targets by default
  - Added `packages/tools/src/web/egress-policy.ts` and wired the HTTP client, GET/POST helpers, and scraper factories through its default-deny policy.
- [x] Ensure destination policy validation covers hostname resolution and IP-literal forms for supported HTTP(S) destinations
  - Validates HTTP(S) schemes, IPv4/IPv6 literals, IPv4-mapped IPv6 literals, and every DNS-resolved address before request execution.
- [x] Ensure redirect handling revalidates every hop and cannot bypass blocked-destination policy through chained redirects
  - Disabled Axios automatic redirects in the shared helper, follows supported redirect responses manually, and validates each `Location` target before the next request with a five-hop default cap.
- [x] Preserve an explicit privileged/internal-network opt-in path with documented policy configuration
  - Exported `DestinationPolicy` and `DEFAULT_DESTINATION_POLICY`; documented the separate `allowLocalhost`, `allowPrivateNetwork`, `allowLinkLocal`, `allowMetadata`, `allowRedirects`, and `maxRedirects` controls.
- [x] Add focused tests covering localhost, metadata, RFC1918/private-network, redirect-bypass, and privileged opt-in behavior
  - `packages/tools/tests/web/egress-policy.test.ts` now covers 17 focused cases, including IPv4/IPv6, DNS resolution pinning, chained redirects, credential stripping, malformed and multi-valued `Location` headers, factory wiring, and privileged opt-in.
- [x] Add or update story documentation at `docs/st11002-web-egress-policy-hardening.md`
  - Added the story rationale, configuration examples, compatibility notes, and validation evidence; linked it from `docs-site/api/tools.md`.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - Added the shared helper, factory wiring, IPv4/IPv6 boundary, DNS, redirect, and opt-in regressions; no further focused automation is required beyond the full validation gates.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the new policy uses the existing package/workspace TypeScript, Vitest, and lint paths.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `225` passed, `9` skipped files; `2526` passed, `110` skipped tests.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with `0` errors and the existing warning baseline.
- [x] Commit completed checklist items as logical commits and push updates
  - `e4f31706` established the red-first test checkpoint; `9960dc41`, `d4c1cc21`, `eeed0dc6`, `6130280e`, and `81c2a21a` contain the implementation and review fixes; PR #161 merged as `0f8d2f55`.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #161 marked ready for review on 2026-07-20 after implementation, documentation, tracker synchronization, `pnpm test --run`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and self-review.
- [x] Wait for merge; do not merge directly from local branch
  - PR #161 merged into `main` on 2026-07-20 as commit `0f8d2f55`; post-merge tracker synchronization is being committed from local `main`.

## ST-11003: Add Filesystem Confinement Controls for Default File Tools

**Branch:** `feat/st-11003-file-tool-confinement`

### Checklist
- [x] Create branch `feat/st-11003-file-tool-confinement`
  - Created on 2026-07-21 from `main` after moving `ST-11003` to `In Progress` in `planning/kanban-queue.md`.
- [x] Create draft PR with story ID in title
  - Draft PR #162 created on 2026-07-21: <https://github.com/TVScoundrel/agentforge/pull/162>
- [x] Define test strategy before implementation: identify the practical failing automated test seam for path confinement, traversal, symlink escape, and recursive-delete safety
  - Strategy: add red-first unit coverage for a shared filesystem policy resolver and the configured file/directory tool factories in `packages/tools/tests/file/confinement.test.ts`, using temporary roots and symlink fixtures where supported.
- [x] Write or update the failing automated test before production changes when practical; if not practical, record why before implementation
  - Added `packages/tools/tests/file/confinement.test.ts` before the production policy; the red run failed as expected because `createFileSystemPolicy` was not yet implemented (`7` tests failed).
- [x] Identify the existing default file read, write, append, exists, directory list/create/delete, and file-search tool paths and define the shared confinement seam
  - Keep pure path utility tools unchanged; route filesystem I/O through a shared policy that can validate lexical paths, resolved existing targets, and creation/deletion parents.
- [x] Add a reusable filesystem confinement policy with allowed roots or workspace-relative mode and an explicit privileged escape hatch
  - Added the exported `FileSystemPolicy`, `createFileSystemPolicy`, `DEFAULT_FILE_SYSTEM_POLICY`, and typed `FileSystemPolicyError`; configured policies support `allowedRoots`, `workspaceRoot`, `allowOutsideRoots`, and `allowRootDeletion`.
- [x] Apply confinement consistently to default file read and mutation tools, directory traversal/list/search, directory creation, and recursive deletion
  - Routed all configured file and directory I/O factories through the shared policy; pure path utilities remain unchanged. Existing standalone exports remain unrestricted for trusted automation, while configured factories enforce traversal, realpath containment, symlink, and recursive-root-deletion checks.
- [x] Add focused tests covering path traversal, symlink escape, allowed-root boundaries, creation parents, missing targets, and recursive-delete edge cases
  - `packages/tools/tests/file/confinement.test.ts` covers 8 focused cases, including non-following directory-list symlinks; the focused suite and full tools package suite pass, including the explicit privileged opt-out path.
- [x] Add or update public docs explaining model-exposed file-tool modes versus trusted local automation
  - Updated `packages/tools/README.md`, `docs-site/api/tools.md`, and `docs-site/guide/concepts/tools.md` with the shared policy configuration and model-exposure guidance.
- [x] Add or update story documentation at `docs/st11003-file-tool-confinement-controls.md`
  - Added the security rationale, API/configuration examples, compatibility impact, and current validation evidence.
- [x] Assess residual test impact; add/update additional automated tests when needed, or document why no further tests are required
  - Focused confinement coverage plus the tools package suite cover the changed filesystem surface; no additional focused automation is currently required.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is expected if the policy is covered by the existing tools-package and workspace TypeScript, Vitest, lint, and build paths.
- [x] Run full test suite before finalizing the PR and record results
  - `pnpm test --run` -> `226` test files passed, `9` skipped; `2534` tests passed, `110` skipped.
- [x] Run lint (`pnpm lint`) before finalizing the PR and record results
  - `pnpm lint` -> passed with `0` errors and the existing `161`-warning baseline; `pnpm typecheck` and `pnpm build` also passed. Build retained the existing VitePress chunk-size warning.
- [x] Commit completed checklist items as logical commits and push updates
  - `b3f15c19` tracker start, `7d08f06c` implementation, and `d0a997a6` review fixes were pushed to `origin/feat/st-11003-file-tool-confinement`; post-merge tracker closure is captured in the main-branch sync commit.
- [x] Mark PR Ready only after all story tasks are complete
  - PR #162 is ready for review on 2026-07-21 after implementation, documentation, focused and full validation, lint, typecheck, build, self-review, and tracker synchronization.
- [x] Wait for merge; do not merge directly from local branch
  - PR #162 merged into `main` on 2026-07-21 as commit `31e2270b`; post-merge tracker synchronization, done-story archival, and ready-lane grooming were completed from local `main`.

---

## ST-11006: Harden Express Chat Example Ownership Semantics

**Branch:** `fix/st-11006-express-chat-example-ownership-hardening`

### Checklist
- [x] Create branch `fix/st-11006-express-chat-example-ownership-hardening`
  - Created as `codex/fix/st-11006-express-chat-example-ownership-hardening` from `main`.
- [x] Create a draft PR with the story ID in the title
  - Draft PR #163 created: <https://github.com/TVScoundrel/agentforge/pull/163>
- [x] Define the test strategy for conversation ownership and the documented demo-only guardrail path
  - Use focused unit coverage for the extracted owner-scoped conversation store and owner-header validation because the example has no HTTP test harness or test dependency; preserve the route behavior through those stable seams.
- [x] Add or update failing route tests before production changes where a practical seam exists
  - Added owner-scoping tests first; the initial run is expected to fail until the store and ownership helpers are implemented.
- [x] Enforce a minimal ownership boundary or clearly document the intentionally unauthenticated demo-only behavior adjacent to the routes and README
  - Added required `X-Demo-User-Id` ownership scoping and documented that it must be replaced with verified application identity in production.
- [x] Ensure history retrieval, deletion, listing, and message mutation do not imply that caller-provided IDs provide production authorization
  - All four chat endpoints now require owner scope; cross-owner reads/deletes are treated as not found.
- [x] Add focused example route coverage for the chosen ownership or guardrail behavior
  - `pnpm --dir examples/integrations/express-api test` -> passed, 1 file and 3 tests.
- [x] Add or update story documentation at `docs/st11006-express-chat-example-ownership-hardening.md`
  - Added the ownership decision, compatibility boundary, test strategy, and validation evidence.
- [x] Assess CI impact and record why no CI change is required unless the example needs a new test command
  - No CI change is required; the example-local Vitest script provides focused coverage and repository gates remain unchanged.
- [x] Run the supported example tests and the repository's canonical full test, lint, typecheck, and build validation
  - `pnpm test --run` -> 226 files passed, 9 skipped; 2534 tests passed, 110 skipped.
  - `pnpm lint` -> passed with existing warning-only baseline and 0 errors.
  - `pnpm typecheck` -> passed for all 6 workspace packages.
  - `pnpm build` -> passed for all 8 build targets.
  - Standalone example typecheck remains unavailable because the example is outside `pnpm-workspace.yaml` and its declared dependencies are not installed in the checkout.
- [x] Commit completed checklist items as logical story-linked commits and push updates
- [x] Mark the PR Ready only after all story tasks are complete
  - PR #163 marked ready for review after tracker synchronization and self-review.
- [x] Wait for merge; do not merge directly from local branch
  - PR #163 merged into `main` on 2026-07-27 as commit `2d79621d`; post-merge tracker synchronization and queue grooming completed from local `main`.

---

## ST-11007: Add Model-Safe File and Web Tool Presets

**Branch:** `feat/st-11007-model-safe-tool-presets`

### Checklist
- [x] Create branch `feat/st-11007-model-safe-tool-presets`
  - Created on 2026-07-28 from `main` after moving `ST-11007` to `In Progress` in `planning/kanban-queue.md`.
- [x] Define focused tests for combined filesystem confinement and web destination-policy behavior
  - Test-first strategy: add focused red/green coverage for named model-safe file and web factories, proving the existing confinement and destination policies remain active through the combined preset surface.
- [x] Add explicit model-safe factory or preset APIs without changing unrestricted trusted exports
  - Added exported `createModelSafeToolPreset`, which combines file, directory, HTTP, and scraper tools while leaving standalone factories unchanged.
- [x] Prove safe presets reject traversal, symlink escapes, private/metadata destinations, and unsafe redirects
  - Added four focused tests covering explicit-root requirements, workspace/public-host success, traversal, symlink escapes, private destinations, redirect revalidation, and forced-safe override flags.
- [x] Update public tool documentation and examples with the recommended model-exposed setup
  - Updated `packages/tools/README.md` and `docs-site/api/tools.md` with the combined preset usage and trusted-automation compatibility boundary.
- [x] Add or update story documentation at `docs/st11007-model-safe-tool-presets.md`
  - Added the story scope, security decisions, usage guidance, and validation evidence.
- [x] Assess CI impact; update CI or document why no CI change is required
  - No CI change is required because the preset is covered by the existing tools-package Vitest, TypeScript, workspace lint, and build paths.
- [x] Run tools tests, typecheck, lint, and build
  - `pnpm --filter @agentforge/tools test --run` -> `91` passed, `9` skipped files; `1157` passed, `110` skipped tests.
  - `pnpm --filter @agentforge/tools typecheck` -> passed.
  - `pnpm lint` -> passed with the existing `161`-warning baseline and `0` errors.
  - `pnpm build` -> passed for all workspace build targets with the existing VitePress chunk-size warning.
  - `pnpm test --run` -> `227` passed, `9` skipped files; `2538` passed, `110` skipped tests.
  - Follow-up review coverage adds direct assertions for forced filesystem root confinement/root-deletion flags and forced metadata/private/local web destination blocks.
- [x] Commit completed checklist items and push updates
  - `69bf3aa1` `feat(st-11007): add model-safe tool preset` pushed to `origin/feat/st-11007-model-safe-tool-presets`; draft PR #164 created with the required story, acceptance, test, validation, and status sections.
- [x] Mark the PR Ready only after all story tasks are complete
  - PR #164 marked ready for review after the final self-review, tracker synchronization, and validation evidence were completed.
- [x] Wait for merge; do not merge directly from local branch
  - PR #164 merged into `main` on 2026-07-28 as commit `1607601c`; post-merge tracker synchronization completed from local `main`.

---

## ST-11008: Tighten Express Example CORS and Request Limits

**Branch:** `fix/st-11008-express-request-boundaries`

### Checklist
- [x] Create branch `fix/st-11008-express-request-boundaries`
  - Created from `main` as `fix/st-11008-express-request-boundaries`.
- [x] Define focused middleware tests for allowed/rejected origins, credentials, and oversized request bodies
  - Added `src/server.test.ts`; focused validation passes with 8 tests.
- [x] Replace wildcard CORS plus credentials with a conservative configurable default
  - Default is exact `http://localhost:3000`; configured origins are checked against the request origin and wildcard mode disables credentials.
- [x] Add bounded JSON and URL-encoded request limits with README/environment guidance
  - Defaults are `100kb`, configurable via `JSON_BODY_LIMIT` and `URLENCODED_BODY_LIMIT`; oversized bodies return 413.
- [x] Update the example documentation to distinguish development overrides from production configuration
  - Updated the README and added `.env.example` with safe defaults and development-only wildcard guidance.
- [x] Add or update story documentation at `docs/st11008-express-request-boundaries.md`
  - Added outcome, test strategy, validation evidence, and CI-impact assessment.
- [x] Run the supported Express example tests, lint, and typecheck
  - `pnpm --dir examples/integrations/express-api test --run` -> passed, 2 files and 8 tests.
  - `pnpm lint` -> passed with existing warnings; `pnpm typecheck` -> passed for all 6 workspace packages.
  - Standalone example `typecheck` was attempted and remains blocked by pre-existing route/model typing incompatibilities; details are recorded in the story doc.
- [x] Commit completed checklist items and push updates
  - Implementation commit `bea54023` pushed to the story branch; PR #165 is open as draft.
- [x] Mark the PR Ready only after all story tasks are complete
  - PR #165 marked ready for review after the implementation and tracker commits.
- [ ] Wait for merge; do not merge directly from local branch
