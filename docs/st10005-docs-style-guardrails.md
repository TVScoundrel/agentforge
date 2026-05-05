# ST-10005: Documentation Style Guardrails for Emoji Usage

## Summary

Add a contributor-facing markdown style rule so decorative emoji are not reintroduced into project-owned documentation after the EP-10 cleanup stories.

## Placement Decision

- The guidance lives in `docs-site/contributing.md` because that file is the existing contributor-facing documentation process guide.
- A new standalone policy file was not created because this story only needs one clear markdown rule in an already authoritative location.

## Rule Scope

- Disallow decorative emoji in headings, bullets, status labels, and prose across project-owned markdown.
- Allow emoji when they are part of literal sample output, demonstrated runtime behavior, or intentionally preserved user-facing content.
- Allow meaningful non-emoji symbols where they improve clarity without acting as decoration.
- Direct future repo-wide markdown cleanup follow-ups into EP-10, which remains the evergreen docs-only lane.

## Test Strategy

- No automated tests are required because this story changes contributor guidance only and does not modify runtime code or docs tooling.
- Validation is direct markdown review plus standard repo quality gates.

## Validation

- `pnpm test --run` passed (`167` files passed, `16` skipped; `2272` tests passed, `286` skipped).
- `pnpm lint` passed with warnings only (`0` errors).
