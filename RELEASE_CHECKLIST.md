# Release Checklist

This checklist ensures all steps are completed before tagging and publishing a new version.

## Pre-Release Checklist

### 1. Code Changes
- [ ] All features/fixes are committed and merged to main
- [ ] All tests are passing (`pnpm test`)
- [ ] Build is successful (`pnpm build`)
- [ ] No linting errors (`pnpm lint`)

### 2. Version Bump
- [ ] Update version in all `package.json` files:
  - [ ] `packages/core/package.json`
  - [ ] `packages/patterns/package.json`
  - [ ] `packages/tools/package.json`
  - [ ] `packages/testing/package.json`
  - [ ] `packages/cli/package.json`
  - [ ] `docs-site/package.json`
- [ ] Update CLI template dependencies in `packages/cli/templates/*/package.json`:
  - [ ] `templates/minimal/package.json`
  - [ ] `templates/full/package.json`
  - [ ] `templates/api/package.json`
  - [ ] `templates/cli/package.json`

### 3. Documentation Updates
- [ ] Update `README.md` version references:
  - [ ] Package table versions
  - [ ] Status badge version
  - [ ] Any version-specific examples
  - [ ] **If test count changed**: Update test count badge (line ~8)
  - [ ] **If test/tool count changed**: Update Phase 6 features (line ~51)
  - [ ] **If tool count changed**: Update package table tool count (line ~72)
  - [ ] **If tool count changed**: Update Phase 6 status tool count (line ~350)
  - [ ] **If test/tool count changed**: Update Project Metrics (lines ~367, 371)
- [ ] Update `docs-site/.vitepress/config.ts`:
  - [ ] Version dropdown text (e.g., `text: 'v0.4.1'`)
- [ ] Update `CHANGELOG.md`:
  - [ ] Add new version section with date
  - [ ] Document all new features under `### Added`
  - [ ] Document all changes under `### Changed`
  - [ ] Document all fixes under `### Fixed`
  - [ ] List all published packages under `### Published`

### 4. Build & Test
- [ ] Run full build: `pnpm build`
- [ ] Run all tests: `pnpm test`
- [ ] Verify test count is correct in CHANGELOG
- [ ] Check for any build warnings or errors

### 5. Commit & Tag
- [ ] Commit all version changes: `git commit -m "chore: Bump version to X.Y.Z"`
- [ ] Verify all files are committed (no uncommitted changes)
- [ ] Create annotated git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Verify tag is on the correct commit: `git log --oneline -3`

### 6. Push to Remote
- [ ] Push commits: `git push`
- [ ] Push tags: `git push --tags`
- [ ] Verify tag appears on GitHub

### 7. Publish to npm
- [ ] Verify npm login: `npm whoami`
- [ ] Publish packages in order:
  - [ ] `cd packages/core && npm publish --access public`
  - [ ] `cd packages/patterns && npm publish --access public`
  - [ ] `cd packages/tools && npm publish --access public`
  - [ ] `cd packages/testing && npm publish --access public`
  - [ ] `cd packages/cli && npm publish --access public`
- [ ] Verify all packages are published:
  - [ ] `npm view @agentforge/core version`
  - [ ] `npm view @agentforge/patterns version`
  - [ ] `npm view @agentforge/tools version`
  - [ ] `npm view @agentforge/testing version`
  - [ ] `npm view @agentforge/cli version`

### 8. Post-Release Verification
- [ ] Test installation: `npx @agentforge/cli@X.Y.Z create test-project`
- [ ] Verify GitHub release tag is visible
- [ ] Check npm registry pages for all packages
- [ ] Update any external documentation if needed

## Quick Reference

### Files to Update for Version Bump
```
packages/core/package.json
packages/patterns/package.json
packages/tools/package.json
packages/testing/package.json
packages/cli/package.json
packages/cli/templates/minimal/package.json
packages/cli/templates/full/package.json
packages/cli/templates/api/package.json
packages/cli/templates/cli/package.json
docs-site/package.json
docs-site/.vitepress/config.ts
README.md
CHANGELOG.md
```

### Publish Order (respects dependencies)
1. @agentforge/core (no agentforge dependencies)
2. @agentforge/patterns, @agentforge/tools, @agentforge/testing (depend on core)
3. @agentforge/cli (depends on all above)

## Notes
- Always update CHANGELOG.md BEFORE creating the git tag
- Always verify the tag is on the correct commit before pushing
- If you need to move a tag, delete it locally and remotely first:
  ```bash
  git tag -d vX.Y.Z
  git push --delete origin vX.Y.Z
  git tag -a vX.Y.Z -m "Release vX.Y.Z"
  git push --tags
  ```

