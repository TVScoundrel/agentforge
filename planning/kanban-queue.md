# Kanban Queue: AgentForge

**Last Updated:** 2026-02-25

## Queue Status Summary

- **Ready:** 1 stories
- **In Progress:** 1 stories
- **In Review:** 0 stories
- **Blocked:** 0 stories
- **Backlog:** 3 stories

---

## Ready

### ST-07006: Update Release Scripts and Checklist
- **Epic:** EP-07 — Extract Skills into Dedicated Package
- **Priority:** P1 (High)
- **Estimate:** 2 hours
- **Dependencies:** ST-07001 (merged)

---

## In Progress

### ST-07002: Move Skills Source Files and Re-wire Imports
- **Epic:** EP-07 — Extract Skills into Dedicated Package
- **Priority:** P0 (Critical)
- **Estimate:** 5 hours
- **Dependencies:** ST-07001 (merged)
- **PR:** #53

---

## In Review

_No stories currently in review_

---

## Blocked

_No stories currently blocked_

---

## Backlog

### ST-07003: Add Deprecation Re-exports in Core
- **Epic:** EP-07
- **Priority:** P1 (High)
- **Estimate:** 3 hours
- **Dependencies:** ST-07002

### ST-07004: Migrate Tests and Fixtures
- **Epic:** EP-07
- **Priority:** P0 (Critical)
- **Estimate:** 4 hours
- **Dependencies:** ST-07002

### ST-07005: Update Documentation and Examples
- **Epic:** EP-07
- **Priority:** P1 (High)
- **Estimate:** 4 hours
- **Dependencies:** ST-07003, ST-07004

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
