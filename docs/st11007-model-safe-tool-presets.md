# ST-11007: Model-Safe File and Web Tool Presets

## Scope

ST-11007 adds an additive `createModelSafeToolPreset` factory to `@agentforge/tools`. It combines the existing file operation, directory operation, HTTP, and scraper factories behind a single model-exposure setup while preserving the existing standalone exports for trusted automation.

## Security Decisions

- A filesystem `workspaceRoot` or non-empty `allowedRoots` configuration is required.
- All configured file and directory tools share one `FileSystemPolicy`.
- `allowOutsideRoots` and `allowRootDeletion` are forced off by the preset.
- Web tools retain destination checks for localhost, private-network, link-local, metadata, and redirect targets.
- Privileged web destination flags supplied to the preset are forced back to their safe defaults.

## Usage

```typescript
import { createModelSafeToolPreset } from '@agentforge/tools';

const { tools } = createModelSafeToolPreset({
  fileSystem: { workspaceRoot: process.cwd() },
});
```

Use the existing `createFileOperationTools`, `createDirectoryOperationTools`, `createHttpTools`, and `createScraperTools` factories directly for trusted operator-controlled workflows that intentionally need privileged access.

## Validation

- Focused red/green coverage: `pnpm --filter @agentforge/tools test --run tests/model-safe-presets.test.ts`
- Coverage includes root requirement, workspace/public-host success, traversal, symlink escape, private destinations, unsafe redirects, and privileged override rejection.
