# Feature Plan: EP-11 Security Boundary Hardening

**Epic Range:** EP-11 through EP-11
**Status:** In Progress
**Last Updated:** 2026-07-20
**Active Story:** ST-11002 - In Review on 2026-07-20 (PR #161); ST-11005 merged on 2026-07-18 (PR #160); ST-11004 merged on 2026-07-16 (PR #159)

---

## Goal

Turn the 2026-07-09 repository security scan into a concrete, reviewable hardening backlog that improves security-sensitive defaults and documents the intended trust model more clearly.

## Why This Epic Exists

The scan findings split into two categories:

1. Framework trust-boundary issues that likely warrant code changes:
   - worker output reused as supervisor routing input
   - untrusted skill content treated as privileged instructions
2. Dangerous-by-design default tools and examples that need clearer policy, safer presets, or stronger guidance:
   - unrestricted outbound web fetches
   - unrestricted file read/write/delete helpers
   - unauthenticated conversation history in the Express example

Without an explicit repository security policy, these findings are harder to triage consistently and easier for downstream adopters to misunderstand.

## Scope

### In Scope

- Repository-level security policy and supported boundary documentation
- Safer default or opt-in-constrained behavior for web and file tool surfaces
- Multi-agent orchestration hardening around worker-to-supervisor trust boundaries
- Skills trust-boundary hardening beyond the existing script-execution policy
- Example guidance or minimal ownership hardening where example code is likely to be copied into production

### Out of Scope

- Full application sandboxing for downstream adopters
- Generic vulnerability management process work outside the repository
- Product-specific auth frameworks for all examples
- Reclassifying every privileged tool as a vulnerability when the real need is documentation and safer presets

## Security Posture Principles

- Privileged tools are allowed to stay powerful, but the framework should not make unsafe model-exposed usage the easiest path.
- Trust boundaries should be explicit in code and docs, especially where untrusted content can influence higher-privilege orchestration.
- Example code should either model a minimally safe pattern or carry adjacent, unavoidable warnings when it is intentionally insecure for brevity.
- New hardening work should prefer additive policy/configuration seams over silent breaking changes unless the story documents a compatibility plan.

## Story Queue

### ST-11001: Publish Repository Security Boundary Policy
- Establish `SECURITY.md` and the canonical policy baseline for future triage.

### ST-11002: Harden Default Web Tool Egress Policy
- Add destination-policy support for HTTP and scraping tools, including private-network and redirect controls.

### ST-11003: Add Filesystem Confinement Controls for Default File Tools
- Add allowed-root or workspace-confinement controls for file read/write/delete helpers.

### ST-11004: Separate Worker Output from Supervisor Routing Input
- Prevent raw worker free-form output from directly becoming supervisor routing instructions.

### ST-11005: Enforce Trust-Aware Skill Prompt and Activation Boundaries
- Stop treating untrusted `SKILL.md` content as equivalent to trusted skill instructions by default.

### ST-11006: Harden Express Chat Example Ownership Semantics
- Add minimal ownership checks or unavoidable production warnings to the example’s history endpoints.

## Recommended Execution Order

1. `ST-11001` — establish policy baseline first
2. `ST-11004` — highest-leverage framework trust-boundary fix
3. `ST-11005` — second highest-leverage framework trust-boundary fix
4. `ST-11002` — safer network defaults/presets
5. `ST-11003` — safer filesystem defaults/presets
6. `ST-11006` — example-only cleanup after framework surfaces are addressed

## Success Criteria

- Security triage can point to an explicit repository policy instead of inferred intent.
- The framework exposes a clearer, safer path for model-controlled web and file access.
- Untrusted worker and skill content no longer flows into higher-privilege orchestration without an explicit boundary.
- Example integrations stop normalizing insecure ownership assumptions.
