# Feature Plan: Agent Skills Compatibility for AgentForge

**Epic Range:** EP-06 through EP-06  
**Status:** Planned  
**Last Updated:** 2026-02-20
**Active Story:** ST-06001 (Backlog)

---

## Feature Overview

**Objective:** Enable AgentForge agents to use reusable skills aligned with the Agent Skills specification, so skills can be discovered, selected, and activated consistently across projects.

**Target Users:**
- AgentForge framework maintainers implementing runtime capabilities
- Agent developers who want reusable, composable skill instructions
- Teams managing internal skill libraries with trust and governance controls

**Desired Outcomes:**
- AgentForge can discover local skill packs from standard skill roots
- Agents can select relevant skills per task before runtime activation
- Full skill content and references are loaded progressively only when needed
- Skill execution follows explicit trust policies and safety guardrails
- Developers can validate compatibility using conformance tests and docs

**Business Value:**
- Reduces duplicated prompt engineering across agents
- Enables portable skill reuse across projects and teams
- Improves safety posture with policy-driven skill activation
- Increases adoption by aligning with an external skills specification

---

## Scope

### In Scope
- Filesystem-based skill discovery from configurable roots
- Parsing and validation of `SKILL.md` metadata and structure
- Deterministic skill matching and activation planning
- Progressive loading of skill content and referenced resources
- Trust policy enforcement for skill execution and resource access
- Documentation, demos, and conformance tests for rollout readiness

### Out of Scope
- Remote skill marketplace integration
- Automatic install or download from third-party skill registries
- Non-markdown skill package formats
- Full cross-framework runtime parity beyond AgentForge integration requirements

---

## Story Coverage by Epic

- EP-06: ST-06001, ST-06002, ST-06003, ST-06004, ST-06005

---

## Validation and Rollout Expectations

- Unit tests: discovery parser, matching logic, policy decisions, and path resolution.
- Integration tests: end-to-end activation with fixture skill packs (valid + malformed + untrusted).
- Demo path: one sample agent run selecting and using two skills from different roots.
- Observability: structured logs/metrics for discovery counts, selection decisions, and policy denials.
- Rollout/rollback control: `agentSkills.enabled` feature flag with default-off rollout and immediate disable path.

---

## Related Planning Documents

- `planning/epics-and-stories.md` (EP-06 and ST-06001 through ST-06005)
- `planning/kanban-queue.md`
- `planning/checklists/epic-06-story-tasks.md`
