# Security Policy

## Supported Versions

AgentForge is developed as an actively released monorepo. Security fixes are only guaranteed for:

- the latest published npm release line
- the current `main` branch before the next release is cut

Older releases and long-unpatched downstream forks should be treated as unsupported unless maintainers explicitly state otherwise in a specific advisory or release note.

## Reporting a Vulnerability

Please do not open public GitHub issues for suspected security vulnerabilities.

Preferred reporting path:

- use a GitHub Security Advisory / private vulnerability report for this repository if available

If that path is unavailable, provide a private report to the maintainers with:

- a clear description of the affected package, file, API, example, or runtime surface
- reproduction steps or a minimal proof of concept
- required preconditions and expected impact
- any relevant version or deployment assumptions

We prefer reports that distinguish:

- framework behavior in shipped packages
- example or demo behavior
- downstream host-application policy choices

## Security Model

AgentForge is a framework for building tool-using agents and multi-agent systems. Some surfaces are intentionally powerful. The project’s security stance depends on whether a capability is:

- a privileged-by-design framework primitive that downstream applications must expose carefully
- or a framework guardrail that AgentForge itself is expected to enforce by default

### Privileged-by-Design Surfaces

The following surfaces are powerful on purpose and must not be treated as safe for arbitrary model-controlled input without additional host-application policy:

- outbound network tools, HTTP clients, scrapers, and similar fetch-capable tools
- filesystem read/write/delete tools
- shell, terminal, process-launch, or similar execution-capable tools
- raw SQL or other direct data-plane mutation tools
- skill activation or prompt-injection mechanisms that load third-party instructions
- examples and demo applications unless they explicitly document production hardening

If a downstream application exposes these surfaces directly to end-user or prompt-injected input, that application must add its own confinement, allowlists, authorization, sandboxing, or operator review controls.

### Framework Guardrails Expected by Default

The following behaviors are intended security guarantees of the framework itself:

- trust boundaries should be explicit where untrusted content can influence higher-privilege orchestration
- untrusted skill roots must not gain script execution by default
- path traversal or equivalent boundary escapes blocked by package guardrails should remain blocked
- security-relevant examples should not silently normalize obviously unsafe patterns as production-ready defaults

Reports that show these guarantees being bypassed, confused, or inconsistently enforced are in scope and actionable.

## Trust Boundaries

When triaging or reporting a finding, use these boundaries:

### 1. End User or Prompt Input vs Agent Runtime

Untrusted prompts, messages, tool arguments, and tool output should be assumed attacker-influenced once a model-exposed workflow exists.

### 2. Worker Agents vs Supervisor or Coordinator Logic

Worker-produced free-form output is not automatically trusted orchestration input. If worker output can steer a higher-privilege supervisor, that is security-relevant.

### 3. Untrusted Skill Roots vs Trusted Skill Roots

AgentForge already distinguishes:

- `workspace`
- `trusted`
- `untrusted`

Scripts from untrusted roots are intentionally blocked by default. Reports about script execution bypasses across that boundary are in scope.

However, non-script skill content can still be security-sensitive. If untrusted skill instructions are presented to the model as though they were trusted system guidance, that is also in scope.

### 4. Framework Packages vs Example Applications

Examples are useful, but they are not automatically production-hardened applications. Findings in examples are still worth reporting when:

- the example claims or strongly implies production readiness
- the example normalizes an insecure pattern that downstream adopters are likely to copy
- the example weakens an advertised framework security guarantee

## Out of Scope

The following are usually not treated as framework vulnerabilities by themselves:

- a downstream application exposing privileged tools to untrusted users without adding its own policy controls
- local developer misuse of intentionally powerful tools
- example code that is clearly marked as demo-only and already documents the missing production controls
- generic “this tool could be dangerous if used dangerously” reports without a violated framework guarantee or missing documented boundary

These may still lead to documentation or hardening work, but they are not automatically security defects in the core framework.

## Safe Adoption Guidance

If you expose AgentForge capabilities to model-controlled or end-user-controlled input:

- treat network, filesystem, shell, and raw data mutation tools as privileged
- add allowlists or confinement for outbound destinations and filesystem roots
- require explicit authorization for history, state, and tenant-scoped resources
- keep untrusted skill packs separate from trusted project skills
- avoid letting worker or tool output become higher-privilege routing instructions without a boundary layer
- review examples before copying them into production

## Disclosure Expectations

We will assess reports based on:

- whether the behavior crosses an intended trust boundary
- whether the affected surface is shipped, documented, or likely to be adopted as-is
- whether the issue is a missing guardrail in AgentForge itself versus a downstream policy decision

When a report is valid but primarily reflects a dangerous-by-design primitive, the likely outcome is one or more of:

- improved documentation
- safer presets or opt-in confinement controls
- clearer trust-boundary signaling
- example hardening

When a report shows an actual boundary bypass or missing framework guardrail, the likely outcome is a code fix plus regression coverage.
