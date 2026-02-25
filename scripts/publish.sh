#!/bin/bash

# AgentForge Publish Script
# This script publishes all packages to npm in the correct order.
# Important: Use pnpm publish so workspace:* deps are rewritten to concrete versions.

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

# Check if logged in to npm
print_step "Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
    print_warning "You are not logged in to npm. Starting login process..."
    echo ""
    if npm login; then
        NPM_USER=$(npm whoami)
        print_success "Successfully logged in as: $NPM_USER"
    else
        print_error "npm login failed. Please try again manually with 'npm login'"
        exit 1
    fi
else
    NPM_USER=$(npm whoami)
    print_success "Already logged in as: $NPM_USER"
fi

# Check if pnpm is available
if ! command -v pnpm > /dev/null 2>&1; then
    print_error "pnpm is required for publishing workspace packages."
    print_error "Install pnpm and retry. npm publish will leak workspace:* dependencies."
    exit 1
fi

# Confirm before publishing
echo ""
print_warning "This will publish all @agentforge packages to npm registry."
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Publish cancelled"
    exit 1
fi

# Get to repo root
cd "$(dirname "$0")/.."

# Publish packages in dependency order
PACKAGES=(
    "packages/core"
    "packages/skills"
    "packages/patterns"
    "packages/tools"
    "packages/testing"
    "packages/cli"
)

echo ""
print_step "Publishing packages in dependency order..."
echo ""

for package in "${PACKAGES[@]}"; do
    if [ -d "$package" ]; then
        PACKAGE_NAME=$(node -e "console.log(require('./$package/package.json').name)")
        PACKAGE_VERSION=$(node -e "console.log(require('./$package/package.json').version)")
        PACKAGE_SHORT_NAME=$(basename "$package")

        print_step "Publishing $PACKAGE_NAME@$PACKAGE_VERSION..."

        # Convert workspace:* dependencies to concrete versions
        # This is necessary because pnpm publish doesn't always convert them automatically
        # See: https://github.com/pnpm/pnpm/issues/5094
        print_step "Converting workspace dependencies..."
        if node scripts/convert-workspace-deps.mjs "$PACKAGE_SHORT_NAME"; then
            print_success "Workspace dependencies converted"
        else
            print_error "Failed to convert workspace dependencies"
            exit 1
        fi

        cd "$package"

        if pnpm publish --access public --no-git-checks; then
            print_success "Published $PACKAGE_NAME@$PACKAGE_VERSION"
        else
            print_error "Failed to publish $PACKAGE_NAME"
            exit 1
        fi

        cd - > /dev/null

        # Restore workspace:* dependencies after publishing
        # This keeps the local development setup intact
        print_step "Restoring workspace dependencies..."
        git checkout "$package/package.json"

        echo ""
    else
        print_warning "Package directory not found: $package"
    fi
done

print_success "All packages published successfully!"
echo ""

# Verify published versions
print_step "Verifying published versions..."
echo ""

for package in "${PACKAGES[@]}"; do
    if [ -d "$package" ]; then
        PACKAGE_NAME=$(node -e "console.log(require('./$package/package.json').name)")
        NPM_VERSION=$(npm view "$PACKAGE_NAME" version 2>/dev/null || echo "not found")
        
        if [ "$NPM_VERSION" != "not found" ]; then
            print_success "$PACKAGE_NAME@$NPM_VERSION"
        else
            print_error "$PACKAGE_NAME - not found on npm"
        fi
    fi
done

echo ""
print_success "Release complete! 🎉"
echo ""
print_step "Next steps:"
echo "  - Verify packages on npm: https://www.npmjs.com/org/agentforge"
echo "  - Test installation: npx @agentforge/cli@latest create test-project"
echo "  - Create GitHub release: ./scripts/create-github-release.sh <version>"
