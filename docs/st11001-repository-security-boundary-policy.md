# ST-11001: Repository Security Boundary Policy

## Summary

This story formalizes AgentForge's repository-level security posture around intentionally powerful framework surfaces versus guardrails the framework itself is expected to enforce. The core `SECURITY.md` policy already captured the supported-version policy, private reporting guidance, trust-boundary model, and scope classification, so the delivery work focused on linking that policy from the maintainer and adopter docs that most directly influence safe usage.

## What Changed

- Reused the existing top-level `SECURITY.md` as the canonical repository security policy.
- Added a root README security section that points maintainers and adopters at the policy before exposing tools, skills, examples, or multi-agent workflows to model-controlled input.
- Updated `docs-site/contributing.md` so security findings are routed to the repository security policy instead of public bug reports.
- Added policy cross-links in:
  - `docs-site/guide/concepts/tools.md`
  - `docs-site/guide/agent-skills.md`
  - `docs-site/guide/agent-skills-authoring.md`
- Added the missing Epic 11 checklist file and updated the planning artifacts to track `ST-11001` through in-progress and in-review status.

## Test Strategy

- No practical failing automated test seam exists for this story because it changes repository policy and documentation routing rather than runtime behavior.
- Validation therefore relies on targeted diff review plus the repository's standard test and lint gates.

## CI Impact

- No CI workflow change is required because the story does not alter runtime code paths or the documented validation contract; the existing repo-wide test and lint commands remain the authoritative quality gates.
