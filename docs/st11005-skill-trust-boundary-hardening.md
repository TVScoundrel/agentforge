# ST-11005: Skill Trust Boundary Hardening

## Summary

`ST-11005` hardens Agent Skills so untrusted skill packs remain discoverable without being treated as implicitly safe privileged instructions. Trusted and workspace roots continue to surface through `<available_skills>` and can be activated normally. Untrusted roots now surface through a separate `<untrusted_skills>` section and `activate-skill` blocks their full SKILL.md bodies until the operator explicitly promotes the root to `trusted` or `workspace`.

## Why This Change Exists

Before this story, skill discovery already tracked root trust levels for script-resource access, but prompt generation and full-skill activation treated every discovered skill the same. That created a trust-boundary mismatch:

- `read-skill-resource` correctly blocked untrusted `scripts/` content by default.
- `generatePrompt()` still surfaced untrusted skill packs alongside trusted ones without a visible distinction.
- `activate-skill` still returned the full SKILL.md body from untrusted roots, even though those instructions could be model-visible and effectively privileged.

That split-brain behavior made it too easy for a model-exposed agent to treat third-party skill instructions as first-party orchestration guidance.

## Implementation Notes

- Prompt generation now annotates trusted skill entries with their trust level and separates untrusted discoveries into a dedicated `<untrusted_skills>` block with an explicit activation-policy notice.
- Full-body activation now uses a trust-policy check parallel to the existing script-resource trust policy.
- `workspace` and `trusted` roots can still activate normally.
- `untrusted` roots stay discoverable for operator review and migration planning, but their SKILL.md bodies stay blocked until the root is explicitly promoted.

## Compatibility Impact

This is a behavior change for adopters who previously relied on plain string roots such as `skillRoots: ['.agentskills']` and expected `activate-skill` to return full SKILL.md bodies immediately.

String roots still normalize to `untrusted` for safe defaults. To preserve pre-hardening activation behavior for reviewed skill packs, migrate those roots to explicit trust objects:

```ts
const registry = new SkillRegistry({
  enabled: true,
  skillRoots: [
    { path: '.agentskills', trust: 'workspace' },
    { path: '/shared/reviewed-skills', trust: 'trusted' },
  ],
});
```

If a root should remain discoverable but not activatable, keep it untrusted.

## Validation

Focused regressions cover:

- prompt generation separating trusted and untrusted skills,
- untrusted-only discovery remaining visible through `<untrusted_skills>`,
- blocked full-body activation for untrusted roots,
- successful activation for explicit `workspace` and `trusted` roots, and
- preserved resource-policy behavior for trusted and untrusted script/resource paths.
