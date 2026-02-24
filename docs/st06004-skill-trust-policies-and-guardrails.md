# ST-06004: Skill Trust Policies and Execution Guardrails

## Overview

Implements a security layer for the Agent Skills system that restricts access to executable script resources (`scripts/` directories) based on configurable trust levels assigned to each skill root.

## Trust Model

### Trust Levels

| Level | Script Access | Description |
|-------|-------------|-------------|
| `workspace` | Allowed | Project-local skills (e.g. `.agentskills/`). Full trust — scripts can be read and executed. |
| `trusted` | Allowed | Externally managed but verified skill roots. Scripts allowed. |
| `untrusted` | **Denied** | Community or unknown skill sources. Scripts blocked by default for security. |

### Default Behaviour

- **Plain string roots** (e.g. `skillRoots: ['/path/to/skills']`) default to `untrusted` trust level for backward compatibility.
- **Script access** from untrusted roots is denied unless `allowUntrustedScripts: true` is explicitly set.
- **Non-script resources** (references, assets, SKILL.md) are always accessible regardless of trust level.

## Configuration

### Skill Root Configuration

**Backward compatible** — string roots default to `'untrusted'`:

```typescript
import { SkillRegistry } from '@agentforge/core';

const registryDefault = new SkillRegistry({
  skillRoots: ['/community/skills'],
});
```

**Explicit trust levels:**

```typescript
const registryMixed = new SkillRegistry({
  skillRoots: [
    { path: '.agentskills', trust: 'workspace' },   // Full trust
    { path: '/org/shared-skills', trust: 'trusted' }, // Verified
    '/community/skills',                               // Untrusted (default)
  ],
});
```

**Override** — allow scripts from untrusted roots (use with caution):

```typescript
const registryOverride = new SkillRegistry({
  skillRoots: ['/community/skills'],
  allowUntrustedScripts: true,
});
```

### Trust Level Effect on `read-skill-resource`

| Resource Path | workspace | trusted | untrusted |
|--------------|-----------|---------|-----------|
| `references/guide.md` | Read | Read | Read |
| `assets/logo.png` | Read | Read | Read |
| `scripts/setup.sh` | Read | Read | **DENIED** |
| `scripts/nested/deep.sh` | Read | Read | **DENIED** |

## Policy Engine

### `evaluateTrustPolicy(resourcePath, trustLevel, allowUntrustedScripts?)`

Returns a `TrustPolicyDecision`:

```typescript
interface TrustPolicyDecision {
  allowed: boolean;
  reason: TrustPolicyReason;
  message: string;
}
```

### Policy Reason Codes

| Reason | Meaning |
|--------|---------|
| `NOT_SCRIPT` | Not a script resource — always allowed |
| `WORKSPACE_TRUST` | Workspace root — scripts allowed |
| `TRUSTED_ROOT` | Trusted root — scripts allowed |
| `UNTRUSTED_SCRIPT_DENIED` | Untrusted root — scripts blocked |
| `UNTRUSTED_SCRIPT_ALLOWED` | Untrusted root — scripts allowed via override |

## API Reference

### SkillRegistry New Methods

```typescript
// Get the allowUntrustedScripts config value
registry.getAllowUntrustedScripts(): boolean;

// Get allowed-tools list for a specific skill (from frontmatter)
registry.getAllowedTools('my-skill'): string[] | undefined;
```

### Skill Trust Level

Every discovered skill now includes a `trustLevel` property:

```typescript
const skill = registry.get('my-skill');
console.log(skill.trustLevel); // 'workspace' | 'trusted' | 'untrusted'
```

## Events

Two new events are emitted by the registry during trust enforcement:

| Event | When |
|-------|------|
| `trust:policy-denied` | Script access blocked by trust policy |
| `trust:policy-allowed` | Script access permitted by trust policy (scripts only) |

Event payload:

```typescript
{
  name: string;           // Skill name
  resourcePath: string;   // Requested resource path
  trustLevel: TrustLevel;
  reason: TrustPolicyReason;
  message?: string;       // Present on TRUST_POLICY_DENIED events
}
```

## Security Considerations

### Defense in Depth

Trust policies operate **after** existing path security checks:

1. **Absolute path rejection** — `/etc/passwd` blocked
2. **Path traversal rejection** — `../../../etc/passwd` blocked
3. **Trust policy enforcement** — `scripts/setup.sh` from untrusted roots blocked
4. **Path containment** — resolved path must stay within skill directory

### Secure Defaults

- All string roots default to `untrusted`
- Scripts from untrusted roots are **denied by default**
- `allowUntrustedScripts` must be **explicitly** set to `true`
- Non-script resources remain accessible (read-only)

### Trust Escalation Workflow

To allow script execution from a root:

1. **Review** the skill scripts manually
2. **Promote** the root to `trusted` or `workspace`:
   ```typescript
   skillRoots: [{ path: '/path', trust: 'trusted' }]
   ```
3. Or set `allowUntrustedScripts: true` (blanket override, not recommended for production)

## Test Coverage

- **41 dedicated trust policy tests** in `trust.test.ts`
- Tests cover: normalizeRootConfig, isScriptResource, evaluateTrustPolicy, integration enforcement, event emission, security regression (path traversal, bypass attempts), getAllowedTools, backward compatibility
- **175 total skills tests** across 6 test files, all passing
