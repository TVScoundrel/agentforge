---
name: community-tool
description: A community-contributed skill with executable scripts that should be trust-gated
version: 0.1.0
allowed-tools:
  - run_in_terminal
---

# Community Tool

This skill comes from an untrusted source and includes scripts.
The trust policy should block script access unless explicitly allowed.

## Usage

1. Read setup instructions from `references/readme.md`
2. Attempt to read `scripts/install.sh` — should be blocked from untrusted roots
