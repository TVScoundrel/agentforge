#!/bin/bash

# Create GitHub Release
# Usage: ./scripts/create-github-release.sh <version>
# Example: ./scripts/create-github-release.sh 0.5.2

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version number required"
  echo "Usage: ./scripts/create-github-release.sh <version>"
  echo "Example: ./scripts/create-github-release.sh 0.5.2"
  exit 1
fi

# Remove 'v' prefix if present
VERSION=${VERSION#v}

echo "==> Creating GitHub Release for v$VERSION..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo ""
  echo "⚠️  GitHub CLI (gh) is not installed."
  echo ""
  echo "To create a GitHub Release, you have two options:"
  echo ""
  echo "Option 1: Install GitHub CLI"
  echo "  brew install gh"
  echo "  gh auth login"
  echo "  ./scripts/create-github-release.sh $VERSION"
  echo ""
  echo "Option 2: Create release manually on GitHub"
  echo "  1. Go to: https://github.com/TVScoundrel/agentforge/releases/new"
  echo "  2. Choose tag: v$VERSION"
  echo "  3. Release title: v$VERSION"
  echo "  4. Copy release notes from docs-site/changelog.md"
  echo "  5. Click 'Publish release'"
  echo ""
  exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
  echo "❌ Error: Not authenticated with GitHub"
  echo "Run: gh auth login"
  exit 1
fi

# Extract release notes from changelog
CHANGELOG_FILE="docs-site/changelog.md"

if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "❌ Error: Changelog not found at $CHANGELOG_FILE"
  exit 1
fi

# Extract the section for this version from changelog
# This is a simple extraction - you might need to adjust based on your changelog format
RELEASE_NOTES=$(awk "/## \[$VERSION\]/,/## \[/" "$CHANGELOG_FILE" | sed '1d;$d')

if [ -z "$RELEASE_NOTES" ]; then
  echo "⚠️  Warning: Could not extract release notes from changelog"
  echo "Using generic release notes..."
  RELEASE_NOTES="Release v$VERSION

See the [full changelog](https://tvscoundrel.github.io/agentforge/changelog.html#_$VERSION) for details.

## Published Packages
- @agentforge/core@$VERSION
- @agentforge/patterns@$VERSION
- @agentforge/tools@$VERSION
- @agentforge/testing@$VERSION
- @agentforge/cli@$VERSION"
fi

# Create the release
echo ""
echo "Creating GitHub Release with the following notes:"
echo "---"
echo "$RELEASE_NOTES"
echo "---"
echo ""

gh release create "v$VERSION" \
  --title "v$VERSION" \
  --notes "$RELEASE_NOTES" \
  --verify-tag

echo ""
echo "✓ GitHub Release created successfully!"
echo "View at: https://github.com/TVScoundrel/agentforge/releases/tag/v$VERSION"

