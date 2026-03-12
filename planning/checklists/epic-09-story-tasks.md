# Epic 09: SOLID Micro-Refactors and Type Boundary Hardening - Story Tasks

## ST-09001: Harden Core Tool Composition Contracts

**Branch:** `fix/st-09001-core-tool-composition-contracts`

### Checklist
- [x] Create branch `fix/st-09001-core-tool-composition-contracts`
  - Created as `codex/fix/st-09001-core-tool-composition-contracts` (workspace branch-prefix policy)
- [ ] Create draft PR with story ID in title
- [ ] Replace explicit `any`-based contracts in `packages/core/src/tools/composition.ts` with generic/`unknown`-based boundaries
- [ ] Refactor composition helpers where needed to keep responsibilities isolated and readable
- [ ] Add/update focused tests for composition flows (sequential, parallel, conditional, retry, timeout, cache)
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09001-core-tool-composition-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09002: Tighten LangChain Converter Runtime Boundary

**Branch:** `fix/st-09002-langchain-converter-boundary-hardening`

### Checklist
- [ ] Create branch `fix/st-09002-langchain-converter-boundary-hardening`
- [ ] Create draft PR with story ID in title
- [ ] Replace avoidable explicit `any` usage in `packages/core/src/langchain/converter.ts` with generic/`unknown` + narrowing
- [ ] Separate schema-conversion and output-serialization responsibilities for clearer module boundaries
- [ ] Add/update focused tests for converter behavior and output serialization edge cases
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09002-langchain-converter-boundary-hardening.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09003: Strengthen LangGraph State Utility Typing

**Branch:** `fix/st-09003-langgraph-state-utility-typing`

### Checklist
- [ ] Create branch `fix/st-09003-langgraph-state-utility-typing`
- [ ] Create draft PR with story ID in title
- [ ] Reduce explicit `any` usage in `packages/core/src/langgraph/state.ts` for channel config and helper APIs
- [ ] Preserve or improve generic inference for reducer/default/schema combinations
- [ ] Add/update focused tests for state validation, default factories, and reducer merge behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09003-langgraph-state-utility-typing.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09004: Refine Observability Payload Contracts

**Branch:** `fix/st-09004-observability-payload-contracts`

### Checklist
- [ ] Create branch `fix/st-09004-observability-payload-contracts`
- [ ] Create draft PR with story ID in title
- [ ] Introduce shared JSON-safe payload contract(s) for observability code paths
- [ ] Reduce explicit `any` usage in `packages/core/src/langgraph/observability/logger.ts` and `packages/core/src/monitoring/alerts.ts`
- [ ] Add/update focused tests for typed payload formatting and alert rule execution behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09004-observability-payload-contracts.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch

---

## ST-09005: Harden Patterns ReAct Node and Shared Agent Builder Types

**Branch:** `fix/st-09005-patterns-react-builder-typing`

### Checklist
- [ ] Create branch `fix/st-09005-patterns-react-builder-typing`
- [ ] Create draft PR with story ID in title
- [ ] Reduce explicit `any` usage in `packages/patterns/src/react/nodes.ts` and `packages/patterns/src/shared/agent-builder.ts`
- [ ] Extract focused helper(s) for message normalization/state access where it improves SRP and readability
- [ ] Add/update focused tests for conditional routing and tool-message construction behavior
- [ ] Record explicit-`any` warning deltas for touched files in story docs
- [ ] Add or update story documentation at `docs/st09005-patterns-react-builder-typing.md` (or document why not required)
- [ ] Assess test impact; add/update automated tests when needed, or document why tests are not required
- [ ] Run full test suite before finalizing the PR and record results
- [ ] Run lint (`pnpm lint`) before finalizing the PR and record results
- [ ] Commit completed checklist items as logical commits and push updates
- [ ] Mark PR Ready only after all story tasks are complete
- [ ] Wait for merge; do not merge directly from local branch
