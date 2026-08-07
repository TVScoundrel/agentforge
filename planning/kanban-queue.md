# Kanban Queue: AgentForge

**Last Updated:** 2026-08-07

## Queue Status Summary

- **Ready:** 0 stories
- **In Progress:** 1 story
- **In Review:** 0 stories
- **Blocked:** 0 stories
- **Backlog:** 0 stories

---

## Ready

None currently.

---

## In Progress

- `ST-11009` — Harden Skill-Powered Agent Filesystem Guidance

---

## In Review

None currently.

---

## Blocked

_No stories currently blocked_

---

## Backlog

None currently.

---

## Notes

- ST-11001 complete - repository security policy routing is now documented through the root README, contributing guide, tools guide, and agent-skills guides; Epic 11 queue grooming promoted `ST-11005`, `ST-11002`, `ST-11003`, and `ST-11006` into `Ready` behind the existing top-priority `ST-11004` after the policy baseline merged (merged 2026-07-15, PR #158)
- ST-11004 complete - multi-agent supervisor routing now preserves trusted `supervisorTask` intent separately from worker `task_result` output, reuses worker results only as labeled untrusted context, and bounds that context for prompt growth safety; the ready lane advanced to `ST-11005`, which moved to `In Progress` on 2026-07-17, with `ST-11002`, `ST-11003`, and `ST-11006` still dependency-ready behind it (merged 2026-07-16, PR #159)
- ST-11005 complete - skill prompts and activation now distinguish trusted/workspace skills from discoverable untrusted skills, block untrusted `SKILL.md` exposure through activation and resource aliases, preserve script-resource policy, and document the root-promotion migration path; the ready lane remains `ST-11002`, `ST-11003`, and `ST-11006` (merged 2026-07-18, PR #160)
- ST-11002 moved to `In Progress` on 2026-07-20 as the next dependency-ready EP-11 story; `ST-11003` and `ST-11006` remain in `Ready` behind the merged `ST-11001` policy baseline
- ST-11002 moved to `In Review` on 2026-07-20 with PR #161 after implementation, focused and full validation, lint, typecheck, build, documentation, and tracker synchronization; `ST-11003` and `ST-11006` remain in `Ready`
- ST-11002 merged on 2026-07-20 as PR #161 / commit `0f8d2f55`; the active EP-11 ready lane remains `ST-11003` followed by `ST-11006`
- ST-11003 moved to `In Progress` on 2026-07-21 as the next dependency-ready EP-11 story; `ST-11006` remains in `Ready` behind the merged `ST-11001` policy baseline
- ST-11003 moved to `In Review` on 2026-07-21 with PR #162 after implementation, documentation, focused and full validation, lint, typecheck, build, and tracker synchronization; `ST-11006` remains in `Ready`
- ST-11003 merged on 2026-07-21 as PR #162 / commit `31e2270b`; removed from the active queue, archived as done, and left `ST-11006` as the next dependency-ready story
- ST-11007, ST-11008, ST-09089, and ST-09091 added to Backlog on 2026-07-27 after source review identified bounded, low-risk follow-on improvements for EP-11 and EP-09; `ST-11006` was the only Ready story before moving to In Progress
- ST-11006 merged on 2026-07-27 as PR #163 / commit `2d79621d`; removed from the active queue, archived as done, and all four accepted follow-on stories were promoted to Ready because their dependencies are now satisfied
- ST-11007 merged on 2026-07-28 as PR #164 / commit `1607601c`; removed from the active queue, archived as done, and `ST-11008` moved to `In Progress` as the next deterministic story on 2026-07-29
- ST-11008 merged on 2026-07-30 as PR #165 / commit `32c0c3dd`; removed from the active queue, archived as done, and the deterministic ready lane now starts with `ST-09089` followed by `ST-09091`
- ST-09089 merged on 2026-07-31 as PR #166 / commit `9640fa1a`; removed from the active queue, archived as done, and `ST-09091` remains the next dependency-ready Ready story
- ST-09091 merged on 2026-08-02 as PR #167 / commit `11ed07e6`; removed from the active queue and archived as done before the next EP-09 grooming batch
- ST-09092, ST-09093, and ST-09094 added to Backlog on 2026-08-02 after source review identified three independent, low-risk EP-09 type-boundary improvements across core wrappers, metadata maps, and Neo4j payloads
- ST-11009 added to Backlog on 2026-08-02 after source review found model-facing skill examples still wire unrestricted file tools despite the merged model-safe preset
- ST-09092 moved to In Progress on 2026-08-03 as the next deterministic EP-09 story; the remaining EP-09 and EP-11 follow-ons remained in Backlog
- ST-09092 merged on 2026-08-03 as PR #168 / commit `4c7a99c1`; removed from the active queue, archived as done, and all three dependency-ready follow-ons were promoted to Ready
- ST-09093 moved to In Progress on 2026-08-04 as the next deterministic EP-09 metadata-boundary story; `ST-09094` and `ST-11009` remain in Ready
- ST-09093 moved to In Review on 2026-08-04 with PR #169 after implementation, documentation, focused and full validation, lint, typecheck, baseline, and tracker synchronization; `ST-09094` and `ST-11009` remain in Ready
- ST-09093 merged on 2026-08-04 as PR #169 / commit `f54a2f5c`; removed from the active queue, archived as done, and `ST-09094` followed by `ST-11009` remains the dependency-ready Ready lane
- ST-09094 moved to In Progress on 2026-08-05 as the next deterministic EP-09 Neo4j payload-boundary story; `ST-11009` remains in Ready
- ST-09094 moved to In Review on 2026-08-05 with PR #170 after implementation, focused and full validation, lint, typecheck, build, documentation, and explicit-any baseline verification; `ST-11009` remains in Ready
- ST-09094 merged on 2026-08-06 as PR #170 / commit `2195e7e4`; removed from the active queue, archived as done, and `ST-11009` remains the next dependency-ready Ready story

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
- ST-09078 complete - relational streaming SELECT executor and tests modularized (merged 2026-07-01, PR #147); `ST-09079` through `ST-09083` are now all dependency-ready in `Ready`, including `ST-09082` and `ST-09083` after their `ST-09078` dependency merged
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
- Complete: ST-09036 - conversation simulator contracts tightened and merged (PR #103, 2026-05-05)
- Epic 09 was expanded a seventh time on 2026-05-05 with `ST-09041` to move `ConversationSimulator` verbose diagnostics onto the structured logging path as a separate observability cleanup.
- Epic 10 (Documentation Only Changes) was opened on 2026-04-18 as an evergreen docs-only lane for markdown cleanup, style normalization, and future documentation maintenance stories
- ST-10001 complete - markdown emoji usage audit merged (PR #97, 2026-05-03); ST-10002 through ST-10005 promoted to Ready as capacity became available
- ST-10002 complete - public-facing docs emoji normalization merged (PR #100, 2026-05-04); ST-10003 remained next in Ready at that point
- ST-09071 complete - skill activation runtime and tests modularized (merged 2026-06-24, PR #140); ST-09075 and ST-09076 promoted from Backlog to Ready because `ST-09070` was already merged
- ST-09072 complete - relational insert executor and tests modularized (merged 2026-06-25, PR #141); ready lane advanced to `ST-09073`
- ST-09073 complete - relational update executor and tests modularized (merged 2026-06-27, PR #142); ready lane advanced to `ST-09074`
- ST-09074 complete - relational delete executor and tests modularized (merged 2026-06-28, PR #143); no additional queue promotion was needed because `ST-09075` and `ST-09076` were already dependency-ready in `Ready`
- Epic 09 was expanded on 2026-06-29 with follow-on backlog story `ST-09077` to stabilize the release-time `pnpm` build/test path after the `0.16.61` release required environment-specific fallback validation outside the documented `RELEASE_PROCESS`
- `ST-09077` was promoted to the front of `Ready` on 2026-06-29 because the release-process friction is worth fixing before the next two patterns-focused follow-up stories
- ST-09077 complete - release-time pnpm validation path stabilized with committed build approvals, a fast-fail approval guard, and canonical `pnpm release:validate` maintainer guidance (merged 2026-06-28, PR #144); ready lane returns to `ST-09075` then `ST-09076`
- ST-09075 complete - ReAct-agent detection hardened around compiled LangGraph runtime shape with constructor-name fallback compatibility preserved (merged 2026-06-29, PR #145); ready lane advances to `ST-09076`
- ST-09076 complete - wrapped ReAct error assignment selection aligned with the shared incomplete-assignment selector, plus focused regression coverage and cold-start timeout headroom for the three known flaky full-suite tests (merged 2026-06-30, PR #146); ready lane advances to `ST-09078`
- Epic 09 was expanded on 2026-06-30 with follow-on backlog stories `ST-09078` through `ST-09082` to replenish the daily SOLID/DRY/modularization lane with one remaining relational runtime split, one CLI command/test split, one multi-agent schema split, one monitoring split, and a smaller relational helper de-duplication slice
- ST-09083 complete - tools-package filtered Vitest validation path restored via a package-local config and package-script wiring fix (merged 2026-07-01, PR #148); no new promotions were needed because `ST-09079` through `ST-09082` were already dependency-ready, and the ready lane now starts with the smaller relational follow-up `ST-09082`
- ST-09082 complete - shared relational row extraction was centralized for the streaming executor path and focused CRUD query-builder suites (merged 2026-07-03, PR #149); no new promotions were needed because `ST-09079` through `ST-09081` were already dependency-ready, and the ready lane now advances to `ST-09079`
- ST-09079 complete - CLI `tool:publish` was modularized into focused path-resolution, preflight, and publish-result helpers, the CLI package gained a package-local Vitest config so `pnpm --filter @agentforge/cli test --run` works from the package context again, and the ready lane now advances to `ST-09080` with `ST-09081` still dependency-ready behind it (merged 2026-07-04, PR #150)
- ST-09080 complete - multi-agent schemas and schema-centric tests were modularized into focused schema-domain modules plus a dedicated schema suite while preserving the stable facade and package-scoped patterns Vitest path (merged 2026-07-07, PR #151); no additional promotions were needed because `ST-09081` was already dependency-ready, and the ready lane now advances to `ST-09081`
- ST-09081 complete - monitoring alert evaluation, throttling, channel dispatch, and error handling were modularized behind a stable public facade, the alert-manager coverage was split into focused suites, and the documented `pnpm --filter @agentforge/core test --run` path now works again from the package context via a package-local Vitest config (merged 2026-07-08, PR #152); the active queue is now empty pending the next accepted EP-09 slice
- Epic 09 was expanded on 2026-07-08 with follow-on stories `ST-09084` through `ST-09088` after the prior ready lane emptied; the new batch targets one remaining multi-agent type-boundary hardening seam, one cross-package tool-testing duplication seam, two relational schema utility modularization slices, and one middleware controller/test modularization slice
- `ST-09088` is intentionally placed at the front of `Ready` because it is the smallest remaining behavior-hardening seam and directly addresses two latent risks in the multi-agent patterns layer before the next broader modularization stories
- ST-09088 complete - multi-agent worker config forwarding now uses sanitized RunnableConfig key-picking, GraphInterrupt detection no longer depends solely on constructor names, hostile getter access no longer breaks the error path, the public patterns utility/error-handling suites gained focused regressions, and `ST-09086` plus `ST-09087` were promoted from Backlog to Ready because they remained dependency-free after the merge (merged 2026-07-09, PR #153)
- ST-09084 complete - core tool-testing helpers and testing-package mock tools now share a focused async execution runtime, the public mock/simulator surfaces stayed backward compatible, `@agentforge/testing` gained a package-local Vitest config so `pnpm --filter @agentforge/testing test --run` works from the workspace root again, and no further queue promotion was needed because `ST-09085` through `ST-09087` were already dependency-ready in `Ready` (merged 2026-07-10, PR #154)
- ST-09085 complete - relational schema type-mapper vendor maps, normalization, and schema-aggregation behavior were modularized behind the stable public facade; the monolithic suite was replaced with focused mapper tests; and the queue was groomed so `ST-11001` plus `ST-11004` were promoted from Backlog to Ready while the deterministic ready lane continues with `ST-09086` then `ST-09087` (merged 2026-07-11, PR #155)
- ST-09086 complete - relational schema diff comparison, JSON import/export validation, and public diff types were modularized behind the stable `schema-diff.ts` facade; the monolithic schema-diff suite was replaced with focused diff and JSON modules plus shared fixtures; and the deterministic ready lane now advances to `ST-09087` with `ST-11001` and `ST-11004` still dependency-ready behind it (merged 2026-07-12, PR #156)
- ST-09087 complete - middleware controller-backed rate-limit and concurrency wiring now shares focused internal orchestration helpers, the oversized middleware integration suite was split into composition, preset, and shared-resource modules, and the deterministic ready lane now advances beyond EP-09 to `ST-11001` with `ST-11004` still dependency-ready behind it (merged 2026-07-13, PR #157)
- Epic 11 (Security Boundary Hardening) was opened on 2026-07-09 after triaging a repository security scan into six backlog stories that separate policy/documentation hardening, safer default tool boundaries, multi-agent and skills trust-boundary fixes, and lower-priority example guidance cleanup
- Complete: ST-10005 - documentation emoji guardrails added to contributor guidance (PR #104, 2026-05-05)
- Complete: ST-10004 - example/template docs emoji normalization merged (PR #102, 2026-05-05)
- Complete: ST-10003 - planning and internal docs emoji normalization merged (PR #101, 2026-05-04)
- EP-10 follow-up story `ST-10006` started on 2026-05-05 to clean remaining decorative emoji in example overview/index markdown while preserving functional status markers and literal sample output.
- Complete: ST-10006 - example overview docs emoji normalization merged (PR #105, 2026-05-05)
- Complete: ST-09047 - JSON and HTTP payload schema contracts tightened (merged 2026-05-21, PR #117)
- Complete: ST-09049 - core tool registry modularized into focused runtime and test modules (merged 2026-05-22, PR #118)
- Complete: ST-09060 - multi-agent schema payload contracts hardened (merged 2026-06-08, PR #129)
- Complete: ST-09062 - core tool executor and tests modularized (merged 2026-06-11, PR #131)
- Complete: ST-09063 - multi-agent worker node and tests modularized (merged 2026-06-12, PR #132)
- Complete: ST-09065 - LangGraph state helpers and tests modularized (merged 2026-06-13, PR #134)
- Complete: ST-09066 - core resource pool and tests modularized (merged 2026-06-16, PR #135)
- Complete: ST-09067 - relational batch executor and tests modularized (merged 2026-06-16, PR #136)
- Complete: ST-09068 - caching middleware and tests modularized (merged 2026-06-17, PR #137)
- Epic 09 (SOLID Micro-Refactors and Type Boundary Hardening) was expanded on 2026-06-12 with follow-on backlog stories ST-09067 through ST-09074 to keep the daily modularization lane stocked after the current ready queue
- Epic 09 was expanded on 2026-06-23 with follow-on backlog stories ST-09075 through ST-09076 to capture post-ST-09070 review debt around ReAct-agent detection robustness and wrapped error-path assignment targeting without displacing the current ready lane
- Current measured `no-explicit-any` baseline is `80` warnings (`cli 6`, `core 19`, `patterns 2`, `testing 0`, `tools 53`)
