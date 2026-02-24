# ST-06006: Comprehensive Docs-Site Documentation for Agent Skills

**Epic:** EP-06 — Agent Skills Compatibility Layer
**PR:** #51 — https://github.com/TVScoundrel/agentforge/pull/51
**Branch:** `docs/st-06006-agent-skills-docs-site`

## Summary

Added comprehensive docs-site documentation for the Agent Skills feature (EP-06). The existing guide pages (`agent-skills.md`, `agent-skills-authoring.md`) were created in ST-06005 as developer setup/authoring references, but they were not linked in the VitePress sidebar and no tutorials, examples, or API reference existed.

## What Was Added

### New Pages

| Page | Path | Lines | Purpose |
|------|------|-------|---------|
| Tutorial | `docs-site/tutorials/skill-powered-agent.md` | ~440 | Step-by-step guide building a skill-powered agent in 9 steps |
| Examples | `docs-site/examples/agent-skills.md` | ~400 | 10 runnable code pattern examples (registry, prompts, tools, trust, events) |
| API reference | `docs-site/api/core.md` (new section) | ~180 | SkillRegistry API, events, types, utility functions |

### VitePress Sidebar Updates

- Added "Agent Skills" section to the guide sidebar with links to `agent-skills.md` and `agent-skills-authoring.md`
- Added "Skill-Powered Agent" to the tutorials sidebar
- Added "Agent Skills" to the examples sidebar

### Cross-Links

- Added "See Also" sections to both existing guide pages linking to tutorial, examples, and API reference
- Tutorial and examples pages include "What's Next?" sections linking back to guides and API reference
- API reference section includes tip box linking to tutorial and examples

## Gap Analysis

Before this story:
- 2 guide pages existed but were **invisible** (not in VitePress sidebar)
- 0 tutorials for Agent Skills (compare: `database-agent.md` for DB tools)
- 0 examples for Agent Skills (compare: `custom-tools.md`)
- 0 API reference for SkillRegistry

After this story:
- All pages are linked and discoverable in the sidebar
- Full tutorial, examples, and API reference coverage
- Cross-linked for discoverability

## Test Assessment

This story is documentation-only. No code changes to `packages/` — only `docs-site/` files. Tests are not required because:
- No runtime code was modified
- The VitePress build (`pnpm --filter docs-site build`) validates page rendering
- Dead links are caught by the build with `ignoreDeadLinks: true` disabled (or manually verified)

## Validation

- `pnpm --filter docs-site build` — builds successfully with no errors
- All new pages are accessible in the sidebar
- Cross-links are consistent across all Agent Skills documentation pages
