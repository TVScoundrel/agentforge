# ST-09071: Skill Activation Runtime and Test Modularization

## Summary

Modularized `packages/skills/src/activation.ts` from a mixed-responsibility runtime into a thin public facade backed by focused activation-tool, resource-tool, path-security, schema, frontmatter-body, and shared-logger helpers. Split the coupled activation coverage into a public entrypoint plus focused suites under `packages/skills/tests/activation/`.

## Test-First Evidence

- This story is behavior-preserving refactor work rather than a new capability, so a red-first assertion on file structure would mostly test temporary layout instead of the stable activation API.
- The practical test-first path was characterization-first coverage:
  - replaced the monolithic `packages/skills/tests/activation.test.ts` body with a stable public entrypoint
  - added focused activation suites in `packages/skills/tests/activation/` before production changes
- First focused run after the suite split:
  - `pnpm test --run packages/skills/tests/activation.test.ts`
  - failed because the new split test harness referenced a non-existent registry helper and created the broken-skill fixture after registry discovery
- Fixed those suite-harness issues, reran the focused entrypoint, and then used the passing public activation coverage as the modularization safety net.

## Implementation Notes

- Extracted focused runtime helpers:
  - `packages/skills/src/activation-activate-tool.ts`
  - `packages/skills/src/activation-resource-tool.ts`
  - `packages/skills/src/activation-path.ts`
  - `packages/skills/src/activation-content.ts`
  - `packages/skills/src/activation-shared.ts`
  - `packages/skills/src/activation-schemas.ts`
- Kept `packages/skills/src/activation.ts` as the stable public facade that still exports `createActivateSkillTool(...)`, `createReadSkillResourceTool(...)`, `createSkillActivationTools(...)`, and `resolveResourcePath(...)`.
- Preserved public behavior around frontmatter body extraction, missing-skill messaging, traversal/symlink blocking, trust-policy enforcement, resource-load event emission, and registry convenience wiring.

## File Size Results

- Production files:
  - `packages/skills/src/activation.ts`: `319 -> 46` lines
  - `packages/skills/src/activation-activate-tool.ts`: `72` lines
  - `packages/skills/src/activation-resource-tool.ts`: `124` lines
  - `packages/skills/src/activation-path.ts`: `44` lines
  - `packages/skills/src/activation-content.ts`: `14` lines
  - `packages/skills/src/activation-shared.ts`: `21` lines
  - `packages/skills/src/activation-schemas.ts`: `10` lines

## Test Modularization Results

- Test files:
  - `packages/skills/tests/activation.test.ts`: `4` lines
  - `packages/skills/tests/activation/shared.ts`: `35` lines
  - `packages/skills/tests/activation/resolve-resource-path.suite.ts`: `76` lines
  - `packages/skills/tests/activation/activate-skill.suite.ts`: `105` lines
  - `packages/skills/tests/activation/read-skill-resource.suite.ts`: `99` lines
  - `packages/skills/tests/activation/activation-tools.suite.ts`: `153` lines

## Residual Test Impact

No additional automated coverage was required beyond the new focused activation suites. The split now isolates path security, activation reads, resource loading, and registry convenience behavior behind the stable `packages/skills/tests/activation.test.ts` public entrypoint while the broader conformance and trust-policy suites continue to cover cross-feature integration.

## Validation

- Focused activation coverage:
  - `pnpm test --run packages/skills/tests/activation.test.ts`
  - `1` file passed, `21` tests passed
- Package compatibility:
  - `pnpm --filter @agentforge/skills typecheck`
  - Passed
- Explicit-`any` baseline:
  - `pnpm lint:explicit-any:baseline`
  - Passed with `80/289` warnings overall and `0/0` in `skills`; no regression introduced

## CI Impact

No CI change required. The story preserves the public skill-activation facade and stays within the repository's existing typecheck, test, lint, and explicit-`any` baseline validation paths.
