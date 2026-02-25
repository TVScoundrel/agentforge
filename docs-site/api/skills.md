# @agentforge/skills

The skills package provides SKILL.md-driven capability loading for agents. Skills are discovered from configurable directories and activated at runtime through tool calls.

## Installation

```bash
pnpm add @agentforge/skills
```

::: tip
For a step-by-step tutorial, see [Building a Skill-Powered Agent](/tutorials/skill-powered-agent). For usage patterns, see [Agent Skills Examples](/examples/agent-skills).
:::

## SkillRegistry {#skillregistry}

Central registry that discovers, indexes, and provides access to SKILL.md-based skills.

```typescript
import { SkillRegistry } from '@agentforge/skills';

const registry = new SkillRegistry({
  skillRoots: [
    { path: './.agentskills', trust: 'workspace' },
  ],
  enabled: true,
});
```

### Constructor Options — `SkillRegistryConfig`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `skillRoots` | `Array<string \| SkillRootConfig>` | *required* | Directories to scan for skills |
| `enabled` | `boolean` | `false` | Gates `generatePrompt()` output |
| `maxDiscoveredSkills` | `number` | `undefined` | Cap on skills included in prompt |
| `allowUntrustedScripts` | `boolean` | `false` | Allow script access from untrusted roots |

### `SkillRootConfig`

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Directory path to scan |
| `trust` | `TrustLevel` | `'workspace' \| 'trusted' \| 'untrusted'` |

Plain string roots default to `{ path: value, trust: 'untrusted' }`.

### Query Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `get(name)` | `Skill \| undefined` | Get a skill by name |
| `getAll()` | `Skill[]` | Get all discovered skills |
| `has(name)` | `boolean` | Check if a skill exists |
| `size()` | `number` | Number of discovered skills |
| `getNames()` | `string[]` | Array of all skill names |
| `getScanErrors()` | `ReadonlyArray<{ path: string; error: string }>` | Errors from last scan |
| `getAllowedTools(name)` | `string[] \| undefined` | Get `allowed-tools` list for a skill |
| `getAllowUntrustedScripts()` | `boolean` | Whether untrusted script override is set |

### `generatePrompt(options?)`

Generates an `<available_skills>` XML block for the LLM system prompt.

```typescript
// All skills
const prompt = registry.generatePrompt();

// Filtered subset
const prompt = registry.generatePrompt({ skills: ['code-review'] });
```

**`SkillPromptOptions`:**

| Property | Type | Description |
|----------|------|-------------|
| `skills` | `string[]` | Optional subset of skill names to include |

Returns an empty string when `enabled` is `false` or no skills match.

### `toActivationTools()`

Returns a tuple of two tools pre-wired to the registry instance:

```typescript
const [activateSkill, readSkillResource] = registry.toActivationTools();
```

| Tool | Schema | Description |
|------|--------|-------------|
| `activate-skill` | `{ name: string }` | Loads the full SKILL.md body content for a skill |
| `read-skill-resource` | `{ name: string, path: string }` | Reads a resource file from a skill directory |

Both tools are in the `ToolCategory.SKILLS` category.

### `discover()`

Re-scans all configured roots and rebuilds the registry. Called automatically during construction.

```typescript
registry.discover(); // Rescan after installing new skills
```

### Event Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `on(event, handler)` | `(SkillRegistryEvent, (data: unknown) => void) => void` | Subscribe to event |
| `off(event, handler)` | `(SkillRegistryEvent, (data: unknown) => void) => void` | Unsubscribe |
| `emitEvent(event, data)` | `(SkillRegistryEvent, unknown) => void` | Emit an event (used by activation tools) |

## SkillRegistryEvent

Enum of events emitted by the registry and activation tools.

| Event | String Value | Payload Shape |
|-------|-------------|---------------|
| `SKILL_DISCOVERED` | `'skill:discovered'` | `Skill` object |
| `SKILL_WARNING` | `'skill:warning'` | `{ skillPath, rootPath, error, duplicateOf? }` |
| `SKILL_ACTIVATED` | `'skill:activated'` | `{ name, skillPath, bodyLength }` |
| `SKILL_RESOURCE_LOADED` | `'skill:resource-loaded'` | `{ name, resourcePath, resolvedPath, contentLength }` |
| `TRUST_POLICY_DENIED` | `'trust:policy-denied'` | `{ name, resourcePath, trustLevel, reason, message }` |
| `TRUST_POLICY_ALLOWED` | `'trust:policy-allowed'` | `{ name, resourcePath, trustLevel, reason }` |

## TrustLevel

```typescript
type TrustLevel = 'workspace' | 'trusted' | 'untrusted';
```

| Level | Reference Files | Script Files | Use Case |
|-------|:---------------:|:------------:|----------|
| `workspace` | ✅ | ✅ | First-party project skills |
| `trusted` | ✅ | ✅ | Vetted community/team skills |
| `untrusted` | ✅ | ❌ | Unknown or unreviewed sources |

## TrustPolicyReason

Enum returned in trust policy decisions for audit logging.

| Reason | When |
|--------|------|
| `NOT_SCRIPT` | Resource is not in `scripts/` — always allowed |
| `WORKSPACE_TRUST` | Root has `workspace` trust — scripts allowed |
| `TRUSTED_ROOT` | Root has `trusted` trust — scripts allowed |
| `UNTRUSTED_SCRIPT_DENIED` | Untrusted root, no override — scripts blocked |
| `UNTRUSTED_SCRIPT_ALLOWED` | Untrusted root but `allowUntrustedScripts: true` |
| `UNKNOWN_TRUST_LEVEL` | Unknown trust level — treated as denied |

## Skill Type

```typescript
interface Skill {
  metadata: SkillMetadata;
  skillPath: string;      // Absolute path to skill directory
  rootPath: string;       // Which configured root this was discovered from
  trustLevel: TrustLevel;
}
```

## SkillMetadata

```typescript
interface SkillMetadata {
  name: string;                       // 1-64 chars, kebab-case, matches directory name
  description: string;                // 1-1024 chars
  license?: string;                   // SPDX identifier
  compatibility?: string[];           // Compatible frameworks
  metadata?: Record<string, unknown>; // Arbitrary key-value pairs
  allowedTools?: string[];            // Tools the skill is designed to use
}
```

## Utility Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `createActivateSkillTool(registry)` | `(SkillRegistry) => Tool` | Create standalone activate-skill tool |
| `createReadSkillResourceTool(registry)` | `(SkillRegistry) => Tool` | Create standalone read-skill-resource tool |
| `createSkillActivationTools(registry)` | `(SkillRegistry) => [Tool, Tool]` | Create both tools as a tuple |
| `resolveResourcePath(skillDir, resourcePath)` | `(string, string) => { success: true; resolvedPath: string } \| { success: false; error: string }` | Validate and resolve a resource path (returns discriminated union) |
| `evaluateTrustPolicy(resourcePath, trustLevel, allowUntrustedScripts?)` | `(...) => TrustPolicyDecision` | Evaluate whether a resource access is allowed |
| `isScriptResource(resourcePath)` | `(string) => boolean` | Check if path targets `scripts/` directory |
| `normalizeRootConfig(root)` | `(string \| SkillRootConfig) => SkillRootConfig` | Normalize string to root config |
| `parseSkillContent(content, dirName)` | `(string, string) => SkillParseResult` | Parse SKILL.md content and validate |
| `validateSkillName(name)` | `(string) => SkillValidationError[]` | Validate skill name format |
| `scanSkillRoot(rootPath)` | `(string) => SkillCandidate[]` | Scan a directory for skill candidates |
| `scanAllSkillRoots(roots)` | `(string[]) => SkillCandidate[]` | Scan multiple root directories |

## Type Definitions

All exports include full TypeScript definitions. See the [source code](https://github.com/TVScoundrel/agentforge/tree/main/packages/skills/src) for complete type information.
