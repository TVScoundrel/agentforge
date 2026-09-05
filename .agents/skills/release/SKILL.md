---
name: release
description: Release a new AgentForge version. Use when the user asks to release, publish, or bump AgentForge to a version.
---

# Release AgentForge

Carry the release through npm publication and a GitHub Release. Track every stage in a checklist and mark a stage complete only when its completion criterion is satisfied.

Before changing files, obtain the target semantic version and release notes from the user if either is missing. Keep one release version throughout the run.

## 1. Bump the version

Start from a clean working tree, then run:

```bash
./scripts/release.sh X.Y.Z
```

The script is the source of truth for files changed by the bump. This stage is complete when it exits successfully and its diff contains the requested version.

## 2. Write the changelog

Add the new `## [X.Y.Z] - YYYY-MM-DD` section immediately after the introduction in `docs-site/changelog.md`. Follow the structure and package-specific style of recent entries. Include the supplied release notes and a `Published` section for every package handled by `scripts/publish.sh`.

The changelog must be updated before validation, commit, or tag creation. This stage is complete when every release note is represented and the published-package list matches the publish script.

## 3. Validate

Run the canonical build and test path sequentially:

```bash
pnpm release:validate
```

If the build-approval guard reports drift, run `pnpm approve-builds --all`, review `pnpm-workspace.yaml`, commit the resulting `allowBuilds` changes with the release, and retry validation.

Record passed and skipped test-file and test totals separately. Classify skips from the output. Expected skips are opt-in external-service integration tests, database benchmarks, PostgreSQL connection tests, and web-search performance tests; report their prerequisites instead of weakening their guards.

Update every existing README test-count summary with the passed-test total. This stage is complete when validation is green and all README counts agree with its output.

## 4. Review and commit

Review `git diff` with the user. Account for every changed file and confirm, at minimum:

- the version-bump script's outputs carry `X.Y.Z`;
- the README version references and test counts are current;
- `docs-site/changelog.md` has the new entry; and
- no unrelated changes are staged.

Create one signed conventional commit:

```bash
git add <release files>
git commit -S -m "chore: Bump version to X.Y.Z"
```

Include the principal release changes in the commit body. Preserve unrelated working-tree changes. This stage is complete when the signed commit contains the reviewed release diff.

## 5. Tag and push

Only after the changelog commit exists, create the annotated tag and verify it points at that commit:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git log --oneline -3
```

Push the release commit and tag. This stage is complete when both are visible on the remote.

## 6. Publish

Publishing mutates npm. Obtain any required external-access approval immediately before starting it, then run this interactively:

```bash
./scripts/publish.sh
```

Treat that terminal session as the single source of truth. Keep exactly one npm browser-auth flow active per prompt:

- Prefer pressing Enter in the waiting script when it offers to open the browser.
- If opening a printed URL manually, do not also press Enter for that prompt.
- Poll the same session until it resumes, presents a new sequential auth prompt, or fails definitively.
- Restart only after definitive failure or an explicit user request.

The script owns dependency order, registry version checks, and the published-package smoke test. If the smoke test must be rerun, execute `./scripts/smoke-test-published-packages.sh X.Y.Z` with external network access; sandboxed fresh installs can stall.

This stage is complete when every package is published at `X.Y.Z`, registry verification succeeds, and the smoke test passes.

## 7. Create the GitHub Release

Obtain any required external-access approval, then run:

```bash
./scripts/create-github-release.sh X.Y.Z
```

The script extracts notes from the changelog and verifies the tag. This stage is complete when the GitHub Release URL exists and the release report includes the commit, tag, npm versions, smoke-test result, passed/skipped validation totals, and skip prerequisites.

## Recovery

Keep recovery proportional to the failure:

- A wrong pre-publication version: rerun `scripts/release.sh` with the correct version and re-review the diff.
- A missing pre-tag changelog: update and commit it before creating the tag.
- A tag on the wrong commit: stop and ask before deleting or replacing local or remote tags.
- A failed publish: diagnose the failure in the existing session; retry only when npm state makes the retry safe.
