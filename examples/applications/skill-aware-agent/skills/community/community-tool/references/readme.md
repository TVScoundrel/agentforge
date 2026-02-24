# Community Tool – Setup Guide

## Prerequisites

- Node.js 18+
- pnpm installed globally

## Installation

Run the provided install script:

```bash
./scripts/install.sh
```

This will configure the community tool in your workspace. Because this is a community (untrusted) skill pack, running this script requires explicitly promoting the skill root to `trusted` or enabling `allowUntrustedScripts` in your `SkillRegistryConfig`.
