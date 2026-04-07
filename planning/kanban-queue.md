# Kanban Queue: AgentForge

**Last Updated:** 2026-04-07

## Queue Status Summary

- **Ready:** 4 stories
- **In Progress:** 0 stories
- **In Review:** 1 story
- **Blocked:** 0 stories
- **Backlog:** 2 stories

---

## Ready

- `ST-09024` - Tighten LangGraph Interrupt Type Contracts
- `ST-09025` - Extract Tool Registry Collection and Search Operations
- `ST-09027` - Extract Connection Manager Vendor Initialization Adapters
- `ST-09029` - Modularize Plan-Execute Node Responsibilities

---

## In Review

- `ST-09023` - Tighten Core Tool Builder Fluent Typing

---

## In Progress

_No stories currently in progress_

---

## Blocked

_No stories currently blocked_

---

## Backlog

- `ST-09026` - Modularize Tool Registry Prompt Rendering and Event Paths
  - Depends on `ST-09025`
- `ST-09028` - Modularize Connection Manager Lifecycle and Reconnection Control
  - Depends on `ST-09027`

---

## Notes

- ✅ ST-01001 complete - foundation established (merged 2026-02-17)
- ✅ ST-01002 complete - connection manager implemented (merged 2026-02-17)
- ✅ ST-01003 complete - connection pooling implemented (merged 2026-02-17)
- ✅ ST-01004 complete - connection lifecycle management implemented (merged 2026-02-18)
- ✅ ST-02001 complete - raw SQL query execution implemented (merged 2026-02-17)
- ✅ ST-02002 complete - type-safe SELECT tool implemented (merged 2026-02-18)
- ✅ ST-02003 complete - type-safe INSERT tool implemented (merged 2026-02-19)
- ✅ ST-02004 complete - type-safe UPDATE tool implemented (merged 2026-02-19)
- ✅ ST-02005 complete - type-safe DELETE tool implemented (merged 2026-02-20)
- ✅ ST-02006 complete - SQL sanitization and security implemented (merged 2026-02-19)
- ✅ ST-03001 complete - schema introspection tool implemented (merged 2026-02-19)
- ✅ ST-03002 complete - schema metadata utilities implemented (merged 2026-02-19)
- ✅ ST-04001 complete - transaction support implemented (merged 2026-02-20)
- ✅ ST-04002 complete - batch operations implemented (merged 2026-02-20)
- ✅ ST-04003 complete - result streaming implemented (merged 2026-02-19)
- ✅ ST-05001 complete - comprehensive unit tests implemented (merged 2026-02-20)
- ✅ ST-05002 complete - integration tests implemented (merged 2026-02-21)
- ✅ ST-05003 complete - usage examples and documentation (merged 2026-02-21)
- ✅ ST-05004 complete - advanced integration examples (merged 2026-02-21)
- ✅ ST-05005 complete - docs-site relational database tools documentation (merged 2026-02-23)
- Epic 01 (Connection Management) is now complete - all 4 stories merged
- Epic 02 (Query Execution and CRUD Operations) is now complete - all 6 stories merged
- Epic 03 (Schema Introspection and Metadata) is now complete - all 2 stories merged
- Epic 04 (Advanced Features and Optimization) is now complete - all 3 stories merged
- Epic 05 (Documentation, Examples, and Testing) is now complete — all 5 stories merged
- New Epic 06 (Agent Skills Compatibility) is planned and queued in Backlog for sequencing after current ready work
- ✅ ST-06001 complete - SkillRegistry with folder-config auto-discovery (merged 2026-02-24)
- ✅ ST-06002 complete - generatePrompt() and system prompt integration (merged 2026-02-24)
- ✅ ST-06003 complete - skill activation and resource tools (merged 2026-02-24)
- ✅ ST-06004 complete - skill trust policies and execution guardrails (merged 2026-02-24)
- ✅ ST-06005 complete - agent skills docs and conformance suite (merged 2026-02-24)
- Epic 06 (Agent Skills Compatibility) — all 6 stories merged; epic complete
- ✅ ST-06006 complete - comprehensive docs-site documentation for Agent Skills (merged 2026-02-24)
- ✅ ST-07001 complete - scaffolded @agentforge/skills package (merged 2026-02-25)
- ✅ ST-07002 complete - moved skills source files and re-wired imports (merged 2026-02-25)
- ✅ ST-07003 complete - removed skills from core, breaking change (merged 2026-02-25)
- ✅ ST-07004 complete - migrated skills tests and fixtures to skills package (merged 2026-02-25)
- ✅ ST-07005 complete - documentation migration to @agentforge/skills imports (merged 2026-02-25)
- ✅ ST-07006 complete - release scripts and checklist updated for skills package (merged 2026-02-25)
- Epic 07 (Extract Skills into Dedicated Package) — all 6 stories merged; epic complete
- Epic 08 (Type Safety Hardening and `no-explicit-any` Debt Burn-Down) created in Fix Mode on 2026-03-06
- ST-08001, ST-08002, ST-08003, and ST-08004 merged (PR #59, PR #60, PR #61, PR #62); Epic 08 complete
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) planned on 2026-03-12
- ✅ ST-09001 complete - core tool composition contracts hardened (merged 2026-03-12)
- ✅ ST-09002 complete - LangChain converter boundary hardened (merged 2026-03-13)
- ✅ ST-09003 complete - LangGraph state utility typing strengthened (merged 2026-03-13)
- ✅ ST-09004 complete - observability payload contracts hardened (merged 2026-03-17)
- ✅ ST-09005 complete - ReAct node and shared builder typing hardened (merged 2026-03-18)
- ✅ ST-09006 complete - ReAct node modularization merged (PR #68, 2026-03-18)
- ✅ ST-09007 complete - ReAct node test modularization merged (PR #69, 2026-03-20)
- ✅ ST-09008 complete - parallel workflow builder typing hardened (PR #70, 2026-03-22)
- ✅ ST-09009 complete - ask-human interrupt boundary hardened (PR #71, 2026-03-23)
- ✅ ST-09010 complete - plan-execute agent routing typing strengthened (PR #72, 2026-03-23)
- ✅ ST-09011 complete - explicit-`any` baseline caps tightened (PR #73, 2026-03-23)
- ✅ ST-09012 complete - package export-map build warnings removed (PR #74, 2026-03-23)
- ✅ ST-09013 complete - sequential workflow builder typing hardened with schema-only inference and intentional breaking type tightening (PR #75, 2026-03-23)
- ✅ ST-09014 complete - plan-execute shared type boundaries tightened (PR #76, 2026-03-24)
- ✅ ST-09015 complete - multi-agent node responsibilities modularized with follow-up hardening for logging, workload invariants, interrupts, and model-content serialization (PR #77, 2026-03-25)
- ✅ ST-09016 complete - monitoring audit and health payload contracts hardened with follow-up fixes for falsy JSON payload preservation, structured startup logging, and timestamp semantics (PR #78, 2026-03-26)
- ✅ ST-09017 complete - CLI command error handling centralized behind a shared helper with follow-up fixes for output ordering, spinner behavior, and `never`-typed exit plumbing (PR #79, 2026-03-27)
- ✅ ST-09018 complete - testing assertion and state-builder helper contracts hardened with follow-up fixes for partial planning results, field-key narrowing, empty conversation initialization, and cross-package message assertions (PR #80, 2026-03-29)
- ✅ ST-09019 complete - reflection agent routing typing hardened by replacing route and compile casts with typed route maps plus focused factory route coverage (PR #81, 2026-03-31)
- ✅ ST-09020 complete - prompt-loader variable contracts hardened around unknown-first and null-prototype variable maps, with follow-up fixes for own-property detection and documented own-enumerable compatibility boundaries (PR #82, 2026-04-02)
- ✅ ST-09021 complete - streaming websocket contracts hardened around structural socket boundaries and unknown-first message payloads (merged 2026-04-03, PR #83)
- ✅ ST-09022 complete - shared deduplication contracts hardened around unknown-first normalization and null-prototype cache-key handling (merged 2026-04-03, PR #84)
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded on 2026-03-22 with low-hanging follow-on stories ST-09008 through ST-09012
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded again on 2026-03-23 with daily hardening stories ST-09013 through ST-09018
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded a third time on 2026-03-23 with daily hardening stories ST-09019 through ST-09028
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded a fourth time on 2026-03-24 with the plan-execute node modularization follow-up story ST-09029
- Current measured `no-explicit-any` baseline is `201` warnings (`cli 6`, `core 82`, `patterns 15`, `testing 31`, `tools 67`)
