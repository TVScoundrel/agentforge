# ST-10002: Public Docs Emoji Normalization

**Story:** ST-10002 - Normalize Emoji Usage in Public-Facing Docs  
**Date:** 2026-05-04  
**Scope:** Public-facing `docs-site/**` pages and package documentation identified by the ST-10001 audit

## Objective

Remove decorative emoji from public-facing Markdown so rendered documentation is consistent and professional while keeping the content materially unchanged.

## Test-Impact Decision

No failing automated test was written before implementation because this story changes Markdown presentation only. There is no runtime behavior, parser contract, or docs tooling behavior to assert with a focused unit test.

Validation will rely on:

- A fenced-code-aware emoji scan for the targeted public/package docs.
- `pnpm test --run` before PR finalization, as required by the story workflow.
- `pnpm lint` before PR finalization, as required by the story workflow.

## Preservation Rules

- Preserve fenced code blocks and literal sample output.
- Preserve meaningful non-emoji Unicode where it is part of existing prose or technical notation.
- Remove decorative heading, bullet, banner, callout, and link-list emoji.
- Convert emoji-only table status cells to plain-text status labels where removing the emoji would otherwise erase meaning.

## Implementation Summary

- Normalized decorative emoji in targeted public docs under `docs-site/**`.
- Normalized decorative emoji in package READMEs and package documentation identified by the ST-10001 audit.
- Left `README.md` unchanged because the ST-10001 audit found no remaining emoji-range matches there.
- Preserved fenced code blocks and literal sample output.

## Validation Notes

- Targeted fenced-code-aware scan result: `outside=0`, `fenced=231`.
- `git diff --check` passed with no whitespace errors.
- `pnpm test --run` passed on 2026-05-04: 166 test files passed, 2267 tests passed, 286 tests skipped.
- `pnpm lint` passed on 2026-05-04 with existing warnings only and no errors.
