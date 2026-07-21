# ST-11003: Filesystem Confinement Controls for Default File Tools

## Rationale

The standard file and directory tools perform host filesystem I/O and are privileged when exposed to model-controlled input. Before this story, every factory accepted raw paths without a shared allowed-root or workspace-relative policy, so path traversal and symlink escapes were left to the downstream application.

## Confinement API

Configure one policy instance on both factory groups:

```typescript
import {
  createDirectoryOperationTools,
  createFileOperationTools,
  createFileSystemPolicy,
} from '@agentforge/tools';

const policy = createFileSystemPolicy({
  workspaceRoot: process.cwd(),
});

const fileTools = createFileOperationTools({ policy });
const directoryTools = createDirectoryOperationTools({ policy });
```

`workspaceRoot` is the base for relative paths and an allowed root. Use `allowedRoots` when an agent needs access to more than one explicitly approved directory. The shared policy validates lexical paths, resolves existing targets and missing creation parents through real paths, and applies the same checks to file reads, writes, appends, existence checks, directory listing/search/creation, and deletion.

Confined operations reject `..` traversal, symlink escapes, paths outside the configured roots, and recursive deletion of an allowed root. The policy returns typed `FileSystemPolicyError` failures; safe tool implementations expose those through their normal `{ success: false, error }` result shape.

## Trusted Automation

The standalone tool exports preserve their existing unrestricted behavior for trusted local automation. A configured factory can also opt out explicitly with `allowOutsideRoots: true`, but this should not be used for model-exposed tools. Pure path utility tools do not perform filesystem I/O and are not part of the confinement policy.

## Compatibility

Existing positional factory arguments remain valid. The new `policy` option is additive on `FileOperationsConfig` and `DirectoryOperationsConfig`, and the public policy types and factory are exported from `@agentforge/tools`.

## Validation

- `packages/tools/tests/file/confinement.test.ts` covers workspace-relative paths, traversal, symlink escape, configured-root deletion, missing creation parents, non-following directory-list symlinks, directory operations, and the privileged opt-out.
- The focused confinement suite passes with 8 tests; the full tools package suite passes with 1153 tests.
- The repository-wide `pnpm test --run` passes with 226 test files passed, 9 skipped; 2534 tests passed, 110 skipped.
- Repository-wide `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass. Lint reports the existing 161-warning baseline with 0 errors; build retains the existing VitePress chunk-size warning.
