#!/bin/bash

# AgentForge Published Package Smoke Test
# Verifies that published packages can be installed from npm and loaded by Node.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

if [ -z "${1:-}" ]; then
    print_error "Usage: ./scripts/smoke-test-published-packages.sh <version>"
    print_error "Example: ./scripts/smoke-test-published-packages.sh 0.15.10"
    exit 1
fi

VERSION="$1"
RETRIES=5
RETRY_DELAY=10

if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use semantic versioning (e.g., 0.15.10)"
    exit 1
fi

TMP_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/agentforge-publish-smoke.XXXXXX")
trap 'rm -rf "$TMP_ROOT"' EXIT

run_with_retries() {
    local description="$1"
    shift

    local attempt
    for attempt in $(seq 1 "$RETRIES"); do
        if "$@"; then
            return 0
        fi

        if [ "$attempt" -lt "$RETRIES" ]; then
            print_warning "$description failed on attempt $attempt/$RETRIES; retrying in ${RETRY_DELAY}s..."
            sleep "$RETRY_DELAY"
        fi
    done

    return 1
}

smoke_test_library_package() {
    local package_name="$1"
    local package_dir="$2"
    local module_type="$3"

    rm -rf "$package_dir"
    mkdir -p "$package_dir"

    (
        cd "$package_dir"
        npm init -y >/dev/null 2>&1
        npm install --ignore-scripts --no-audit --no-fund "${package_name}@${VERSION}" >/dev/null

        if [ "$module_type" = "require" ]; then
            node -e "const mod = require('${package_name}'); if (!mod || Object.keys(mod).length === 0) { throw new Error('No exports found for ${package_name}'); }"
        else
            node --input-type=module -e "const mod = await import('${package_name}'); if (!mod || Object.keys(mod).length === 0) { throw new Error('No exports found for ${package_name}'); }"
        fi
    )
}

smoke_test_cli_package() {
    local package_name="$1"
    local package_dir="$2"

    rm -rf "$package_dir"
    mkdir -p "$package_dir"

    (
        cd "$package_dir"
        npm init -y >/dev/null 2>&1
        npm install --ignore-scripts --no-audit --no-fund "${package_name}@${VERSION}" >/dev/null
        ./node_modules/.bin/agentforge --help >/dev/null
    )
}

smoke_test_testing_package() {
    local package_name="$1"
    local package_dir="$2"

    rm -rf "$package_dir"
    mkdir -p "$package_dir"

    (
        cd "$package_dir"
        npm init -y >/dev/null 2>&1
        npm install --ignore-scripts --no-audit --no-fund "${package_name}@${VERSION}" vitest >/dev/null
        cat > smoke.test.mjs <<'EOF'
import { describe, expect, it } from 'vitest';
import { createStateBuilder } from '@agentforge/testing';

describe('@agentforge/testing smoke test', () => {
  it('exports test helpers inside Vitest', () => {
    expect(typeof createStateBuilder).toBe('function');
  });
});
EOF
        npx vitest run smoke.test.mjs --reporter dot >/dev/null
    )
}

print_step "Running published package smoke tests for version $VERSION"
echo ""

print_step "Testing @agentforge/core@$VERSION"
run_with_retries \
    "@agentforge/core@$VERSION smoke test" \
    smoke_test_library_package "@agentforge/core" "$TMP_ROOT/core" "require"
print_success "@agentforge/core@$VERSION installed and loaded successfully"

print_step "Testing @agentforge/skills@$VERSION"
run_with_retries \
    "@agentforge/skills@$VERSION smoke test" \
    smoke_test_library_package "@agentforge/skills" "$TMP_ROOT/skills" "require"
print_success "@agentforge/skills@$VERSION installed and loaded successfully"

print_step "Testing @agentforge/patterns@$VERSION"
run_with_retries \
    "@agentforge/patterns@$VERSION smoke test" \
    smoke_test_library_package "@agentforge/patterns" "$TMP_ROOT/patterns" "require"
print_success "@agentforge/patterns@$VERSION installed and loaded successfully"

print_step "Testing @agentforge/tools@$VERSION"
run_with_retries \
    "@agentforge/tools@$VERSION smoke test" \
    smoke_test_library_package "@agentforge/tools" "$TMP_ROOT/tools" "require"
print_success "@agentforge/tools@$VERSION installed and loaded successfully"

print_step "Testing @agentforge/testing@$VERSION"
run_with_retries \
    "@agentforge/testing@$VERSION smoke test" \
    smoke_test_testing_package "@agentforge/testing" "$TMP_ROOT/testing"
print_success "@agentforge/testing@$VERSION installed and passed a Vitest smoke test"

print_step "Testing @agentforge/cli@$VERSION"
run_with_retries \
    "@agentforge/cli@$VERSION smoke test" \
    smoke_test_cli_package "@agentforge/cli" "$TMP_ROOT/cli"
print_success "@agentforge/cli@$VERSION installed and executed successfully"

echo ""
print_success "All published package smoke tests passed for version $VERSION"
