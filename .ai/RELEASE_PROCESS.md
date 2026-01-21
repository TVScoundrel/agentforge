# AI Assistant Release Process Guide

**This file is specifically for AI assistants helping with releases.**

When the user asks you to "do a release" or "bump version to X.Y.Z", follow these steps EXACTLY:

## Step 0: Preparation
1. **Read RELEASE_CHECKLIST.md** - Review the full checklist first
2. **Create tasks** - Use task management tools to create tasks for each major step
3. **Ask for version** - If not provided, ask what version number to use

## Step 1: Run Version Bump Script
```bash
./scripts/release.sh X.Y.Z
```
- This updates all package.json files, CLI templates, README, and docs-site config
- Mark task as COMPLETE after running

## Step 2: Update VitePress Changelog (CRITICAL - DON'T SKIP!)
**This is the step most commonly forgotten!**

1. Open `docs-site/changelog.md`
2. Add new version section at the top (after the header):
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   ### Added
   - List new features

   ### Changed
   - List changes

   ### Fixed
   - List bug fixes

   ### Published
   - All packages published to npm registry at version X.Y.Z:
     - @agentforge/core@X.Y.Z
     - @agentforge/patterns@X.Y.Z
     - @agentforge/tools@X.Y.Z
     - @agentforge/testing@X.Y.Z
     - @agentforge/cli@X.Y.Z
   ```
3. Also update the "Version History" section at the bottom with a one-line summary
4. Ask user for release notes if not provided
5. Mark task as COMPLETE after updating

## Step 3: Build and Test
```bash
pnpm build
pnpm test
```
- Verify all tests pass
- Check for any build errors
- Mark task as COMPLETE after successful build/test

## Step 4: Review Changes
```bash
git diff
```
- Show user the diff
- Confirm all expected files are updated
- Mark task as COMPLETE after review

## Step 5: Commit Changes
```bash
git add .
git commit -m "chore: Bump version to X.Y.Z"
```
- Commit message should follow conventional commits
- Mark task as COMPLETE after commit

## Step 6: Create Git Tag
**IMPORTANT: Only do this AFTER docs-site/changelog.md is updated!**

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z

Features:
- List key features from changelog

All packages updated to X.Y.Z"
```
- Verify tag is on correct commit: `git log --oneline -3`
- Mark task as COMPLETE after tagging

## Step 7: Push to Remote
```bash
git push && git push --tags
```
- Push both commits and tags
- Verify tag appears on GitHub
- Mark task as COMPLETE after pushing

## Step 8: Publish to npm
**Ask user to confirm they are logged in to npm first!**

```bash
./scripts/publish.sh
```
- Script will verify npm login
- Script will ask for confirmation
- Script publishes in correct dependency order
- Script verifies all packages published
- Mark task as COMPLETE after publishing

## Step 9: Verify Release
```bash
npm view @agentforge/core version
npm view @agentforge/patterns version
npm view @agentforge/tools version
npm view @agentforge/testing version
npm view @agentforge/cli version
```
- Confirm all show the new version
- Mark task as COMPLETE after verification

## Step 10: Create GitHub Release
**This step provides better visibility than just a git tag!**

```bash
./scripts/create-github-release.sh X.Y.Z
```

If GitHub CLI is not installed, the script will provide instructions for:
- Installing GitHub CLI (`brew install gh`)
- Or creating the release manually on GitHub

Benefits of GitHub Releases:
- Shows up in the Releases page for easy discovery
- Sends notifications to repository watchers
- Provides formatted release notes
- Links to the git tag automatically

- Mark task as COMPLETE after creating release

## Common Mistakes to Avoid
1. ❌ **Forgetting to update docs-site/changelog.md** - This is the #1 mistake!
2. ❌ **Creating git tag before changelog is updated** - Tag will be on wrong commit
3. ❌ **Not using task management** - Easy to lose track of steps
4. ❌ **Skipping build/test** - Could publish broken code
5. ❌ **Not verifying npm login** - Publish will fail
6. ❌ **Publishing in wrong order** - Dependencies will break
7. ❌ **Forgetting to create GitHub Release** - Just tagging is not enough for visibility

## Task Management Template
When starting a release, create these tasks:
- [ ] Run version bump script
- [ ] Update docs-site/changelog.md
- [ ] Build and test
- [ ] Review changes
- [ ] Commit changes
- [ ] Create git tag (AFTER changelog!)
- [ ] Push to remote
- [ ] Publish to npm
- [ ] Verify published versions
- [ ] Create GitHub Release

## Quick Checklist
Before creating the git tag, verify:
- ✅ All package.json files updated
- ✅ CLI templates updated
- ✅ README.md updated
- ✅ docs-site config updated
- ✅ **docs-site/changelog.md updated** ← Most important!
- ✅ Build successful
- ✅ Tests passing
- ✅ Changes committed

## If Something Goes Wrong
- **Wrong version number**: Run release.sh again with correct version
- **Forgot changelog**: Update it, commit, then move the tag
- **Tag on wrong commit**: Delete tag locally and remotely, recreate on correct commit
  ```bash
  git tag -d vX.Y.Z
  git push --delete origin vX.Y.Z
  git tag -a vX.Y.Z -m "Release vX.Y.Z"
  git push --tags
  ```
- **Publish failed**: Check npm login, fix issue, run publish.sh again

