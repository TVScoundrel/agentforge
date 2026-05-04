# Kanban Queue: AgentForge

**Last Updated:** 2026-05-04

## Queue Status Summary

- **Ready:** 3 stories
- **In Progress:** 0 stories
- **In Review:** 1 story
- **Blocked:** 0 stories
- **Backlog:** 4 stories

---

## Ready

- `ST-10004` - Normalize Emoji Usage in Examples and Template Docs
- `ST-10005` - Add Documentation Style Guardrails for Emoji Usage
- `ST-09036` - Tighten Conversation Simulator Agent Contracts

---

## In Progress

_No stories currently in progress_

---

## In Review

- `ST-10003` - Normalize Emoji Usage in Planning and Internal Docs

---

## Blocked

_No stories currently blocked_

---

## Backlog

- `ST-09037` - Tighten ReAct Builder and Prompt Boundary Contracts
- `ST-09038` - Extract Data Transformer Object Path Helpers
- `ST-09039` - Tighten Core Mock Tool Testing Helper Contracts
- `ST-09040` - Tighten Human-in-Loop Streaming Resume Contracts

---

## Notes

- Complete: ST-01001 - foundation established (merged 2026-02-17)
- Complete: ST-01002 - connection manager implemented (merged 2026-02-17)
- Complete: ST-01003 - connection pooling implemented (merged 2026-02-17)
- Complete: ST-01004 - connection lifecycle management implemented (merged 2026-02-18)
- Complete: ST-02001 - raw SQL query execution implemented (merged 2026-02-17)
- Complete: ST-02002 - type-safe SELECT tool implemented (merged 2026-02-18)
- Complete: ST-02003 - type-safe INSERT tool implemented (merged 2026-02-19)
- Complete: ST-02004 - type-safe UPDATE tool implemented (merged 2026-02-19)
- Complete: ST-02005 - type-safe DELETE tool implemented (merged 2026-02-20)
- Complete: ST-02006 - SQL sanitization and security implemented (merged 2026-02-19)
- Complete: ST-03001 - schema introspection tool implemented (merged 2026-02-19)
- Complete: ST-03002 - schema metadata utilities implemented (merged 2026-02-19)
- Complete: ST-04001 - transaction support implemented (merged 2026-02-20)
- Complete: ST-04002 - batch operations implemented (merged 2026-02-20)
- Complete: ST-04003 - result streaming implemented (merged 2026-02-19)
- Complete: ST-05001 - comprehensive unit tests implemented (merged 2026-02-20)
- Complete: ST-05002 - integration tests implemented (merged 2026-02-21)
- Complete: ST-05003 - usage examples and documentation (merged 2026-02-21)
- Complete: ST-05004 - advanced integration examples (merged 2026-02-21)
- Complete: ST-05005 - docs-site relational database tools documentation (merged 2026-02-23)
- Epic 01 (Connection Management) is now complete - all 4 stories merged
- Epic 02 (Query Execution and CRUD Operations) is now complete - all 6 stories merged
- Epic 03 (Schema Introspection and Metadata) is now complete - all 2 stories merged
- Epic 04 (Advanced Features and Optimization) is now complete - all 3 stories merged
- Epic 05 (Documentation, Examples, and Testing) is now complete — all 5 stories merged
- New Epic 06 (Agent Skills Compatibility) is planned and queued in Backlog for sequencing after current ready work
- Complete: ST-06001 - SkillRegistry with folder-config auto-discovery (merged 2026-02-24)
- Complete: ST-06002 - generatePrompt() and system prompt integration (merged 2026-02-24)
- Complete: ST-06003 - skill activation and resource tools (merged 2026-02-24)
- Complete: ST-06004 - skill trust policies and execution guardrails (merged 2026-02-24)
- Complete: ST-06005 - agent skills docs and conformance suite (merged 2026-02-24)
- Epic 06 (Agent Skills Compatibility) — all 6 stories merged; epic complete
- Complete: ST-06006 - comprehensive docs-site documentation for Agent Skills (merged 2026-02-24)
- Complete: ST-07001 - scaffolded @agentforge/skills package (merged 2026-02-25)
- Complete: ST-07002 - moved skills source files and re-wired imports (merged 2026-02-25)
- Complete: ST-07003 - removed skills from core, breaking change (merged 2026-02-25)
- Complete: ST-07004 - migrated skills tests and fixtures to skills package (merged 2026-02-25)
- Complete: ST-07005 - documentation migration to @agentforge/skills imports (merged 2026-02-25)
- Complete: ST-07006 - release scripts and checklist updated for skills package (merged 2026-02-25)
- Epic 07 (Extract Skills into Dedicated Package) — all 6 stories merged; epic complete
- Epic 08 (Type Safety Hardening and `no-explicit-any` Debt Burn-Down) created in Fix Mode on 2026-03-06
- ST-08001, ST-08002, ST-08003, and ST-08004 merged (PR #59, PR #60, PR #61, PR #62); Epic 08 complete
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) planned on 2026-03-12
- Complete: ST-09001 - core tool composition contracts hardened (merged 2026-03-12)
- Complete: ST-09002 - LangChain converter boundary hardened (merged 2026-03-13)
- Complete: ST-09003 - LangGraph state utility typing strengthened (merged 2026-03-13)
- Complete: ST-09004 - observability payload contracts hardened (merged 2026-03-17)
- Complete: ST-09005 - ReAct node and shared builder typing hardened (merged 2026-03-18)
- Complete: ST-09006 - ReAct node modularization merged (PR #68, 2026-03-18)
- Complete: ST-09007 - ReAct node test modularization merged (PR #69, 2026-03-20)
- Complete: ST-09008 - parallel workflow builder typing hardened (PR #70, 2026-03-22)
- Complete: ST-09009 - ask-human interrupt boundary hardened (PR #71, 2026-03-23)
- Complete: ST-09010 - plan-execute agent routing typing strengthened (PR #72, 2026-03-23)
- Complete: ST-09011 - explicit-`any` baseline caps tightened (PR #73, 2026-03-23)
- Complete: ST-09012 - package export-map build warnings removed (PR #74, 2026-03-23)
- Complete: ST-09013 - sequential workflow builder typing hardened with schema-only inference and intentional breaking type tightening (PR #75, 2026-03-23)
- Complete: ST-09014 - plan-execute shared type boundaries tightened (PR #76, 2026-03-24)
- Complete: ST-09015 - multi-agent node responsibilities modularized with follow-up hardening for logging, workload invariants, interrupts, and model-content serialization (PR #77, 2026-03-25)
- Complete: ST-09016 - monitoring audit and health payload contracts hardened with follow-up fixes for falsy JSON payload preservation, structured startup logging, and timestamp semantics (PR #78, 2026-03-26)
- Complete: ST-09017 - CLI command error handling centralized behind a shared helper with follow-up fixes for output ordering, spinner behavior, and `never`-typed exit plumbing (PR #79, 2026-03-27)
- Complete: ST-09018 - testing assertion and state-builder helper contracts hardened with follow-up fixes for partial planning results, field-key narrowing, empty conversation initialization, and cross-package message assertions (PR #80, 2026-03-29)
- Complete: ST-09019 - reflection agent routing typing hardened by replacing route and compile casts with typed route maps plus focused factory route coverage (PR #81, 2026-03-31)
- Complete: ST-09020 - prompt-loader variable contracts hardened around unknown-first and null-prototype variable maps, with follow-up fixes for own-property detection and documented own-enumerable compatibility boundaries (PR #82, 2026-04-02)
- Complete: ST-09021 - streaming websocket contracts hardened around structural socket boundaries and unknown-first message payloads (merged 2026-04-03, PR #83)
- Complete: ST-09022 - shared deduplication contracts hardened around unknown-first normalization and null-prototype cache-key handling (merged 2026-04-03, PR #84)
- Complete: ST-09023 - core tool builder fluent typing tightened with metadata-isolation, clone-failure, and invoke-compatibility follow-up fixes (merged 2026-04-07, PR #85)
- Complete: ST-09027 - connection-manager vendor initialization extracted into focused internal helpers with follow-up logger and vendor-pairing contract fixes (merged 2026-04-16, PR #89)
- Complete: ST-09034 - snapshot testing runner contracts hardened (merged 2026-04-25, PR #96)
- Complete: ST-09033 - database pool adapter contracts tightened around unknown-first query parameter/result boundaries (merged 2026-05-03, PR #98)
- Complete: ST-09035 - agent test runner state contracts tightened around unknown-first input/state/result/step boundaries (merged 2026-05-04, PR #99)
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded on 2026-03-22 with low-hanging follow-on stories ST-09008 through ST-09012
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded again on 2026-03-23 with daily hardening stories ST-09013 through ST-09018
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded a third time on 2026-03-23 with daily hardening stories ST-09019 through ST-09028
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded a fourth time on 2026-03-24 with the plan-execute node modularization follow-up story ST-09029
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded a fifth time on 2026-04-16 with follow-on backlog stories ST-09030 through ST-09035
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded a sixth time on 2026-05-03 with small SOLID/DRY follow-on stories ST-09036 through ST-09040
- Epic 10 (Documentation Only Changes) was opened on 2026-04-18 as an evergreen docs-only lane for markdown cleanup, style normalization, and future documentation maintenance stories
- ST-10001 complete - markdown emoji usage audit merged (PR #97, 2026-05-03); ST-10002 through ST-10005 promoted to Ready as capacity became available
- ST-10002 complete - public-facing docs emoji normalization merged (PR #100, 2026-05-04); ST-10003 remains next in Ready
- Current measured `no-explicit-any` baseline is `135` warnings (`cli 6`, `core 44`, `patterns 15`, `testing 5`, `tools 65`)
