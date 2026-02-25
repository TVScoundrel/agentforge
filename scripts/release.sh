#!/bin/bash

# AgentForge Release Script
# This script automates the version bump process for all packages
#
# FULL RELEASE PROCESS (see RELEASE_CHECKLIST.md):
# 1. Run this script: ./scripts/release.sh X.Y.Z
# 2. Update CHANGELOG.md with release notes (IMPORTANT!)
# 3. Build and test: pnpm build && pnpm test
# 4. Review changes: git diff
# 5. Commit: git add . && git commit -m "chore: Bump version to X.Y.Z"
# 6. Tag: git tag -a vX.Y.Z -m "Release vX.Y.Z"
# 7. Push: git push && git push --tags
# 8. Publish (uses pnpm publish): ./scripts/publish.sh
#
# AI Assistant: When asked to do a release, ALWAYS:
# - Read RELEASE_CHECKLIST.md first
# - Use task management to track all steps
# - Don't skip CHANGELOG.md update
# - Don't create git tag until CHANGELOG is updated

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if version argument is provided
if [ -z "$1" ]; then
    print_error "Usage: ./scripts/release.sh <version>"
    print_error "Example: ./scripts/release.sh 0.4.2"
    exit 1
fi

NEW_VERSION=$1

# Validate version format (basic semver check)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use semantic versioning (e.g., 0.4.2)"
    exit 1
fi

print_step "Starting release process for version $NEW_VERSION"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You are not on the main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

print_success "Working directory is clean"

# Update package.json files
print_step "Updating package.json files..."

PACKAGE_FILES=(
    "package.json"
    "packages/core/package.json"
    "packages/patterns/package.json"
    "packages/tools/package.json"
    "packages/skills/package.json"
    "packages/testing/package.json"
    "packages/cli/package.json"
    "docs-site/package.json"
)

for file in "${PACKAGE_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Use Node.js to update the version field
        node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('$file'));pkg.version='$NEW_VERSION';fs.writeFileSync('$file',JSON.stringify(pkg,null,2)+'\n');"
        print_success "Updated $file"
    else
        print_warning "File not found: $file"
    fi
done

# Update CLI template dependencies
print_step "Updating CLI template dependencies..."

TEMPLATE_FILES=(
    "packages/cli/templates/minimal/package.json"
    "packages/cli/templates/full/package.json"
    "packages/cli/templates/api/package.json"
    "packages/cli/templates/cli/package.json"
)

for file in "${TEMPLATE_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Update all @agentforge/* dependencies to ^NEW_VERSION
        node -e "
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('$file'));
if(pkg.dependencies){
    Object.keys(pkg.dependencies).forEach(dep=>{
        if(dep.startsWith('@agentforge/')){
            pkg.dependencies[dep]='^$NEW_VERSION';
        }
    });
}
fs.writeFileSync('$file',JSON.stringify(pkg,null,2)+'\n');
"
        print_success "Updated $file"
    else
        print_warning "File not found: $file"
    fi
done

# Update docs-site config
print_step "Updating docs-site config..."
if [ -f "docs-site/.vitepress/config.ts" ]; then
    sed -i.bak "s/text: 'v[0-9]*\.[0-9]*\.[0-9]*'/text: 'v$NEW_VERSION'/" docs-site/.vitepress/config.ts
    rm docs-site/.vitepress/config.ts.bak
    print_success "Updated docs-site/.vitepress/config.ts"
fi

# Update README.md
print_step "Updating README.md..."
if [ -f "README.md" ]; then
    # Update "AgentForge vX.Y.Z" status line
    sed -i.bak "s/AgentForge v[0-9]*\.[0-9]*\.[0-9]*/AgentForge v$NEW_VERSION/g" README.md
    # Update package table versions (| 0.X.Y | format)
    sed -i.bak "s/| [0-9]*\.[0-9]*\.[0-9]* |/| $NEW_VERSION |/g" README.md
    rm README.md.bak 2>/dev/null || true
    print_success "Updated README.md"
fi

print_success "All version files updated to $NEW_VERSION"
echo ""
print_warning "IMPORTANT: You still need to:"
echo "  1. Update CHANGELOG.md with release notes"
echo "  2. Run 'pnpm build' to rebuild all packages"
echo "  3. Run 'pnpm test' to verify all tests pass"
echo "  4. Review all changes with 'git diff'"
echo "  5. Commit changes: git add . && git commit -m 'chore: Bump version to $NEW_VERSION'"
echo "  6. Create tag: git tag -a v$NEW_VERSION -m 'Release v$NEW_VERSION'"
echo "  7. Push: git push && git push --tags"
echo "  8. Publish to npm (see RELEASE_CHECKLIST.md)"
echo ""
print_step "See RELEASE_CHECKLIST.md for the complete release process"
