# ST-01001: Setup Drizzle ORM Dependencies and Project Structure

**Status:** ✅ Complete  
**Story ID:** ST-01001  
**Epic:** EP-01 (Core Database Connection Management)  
**Priority:** P0 (Critical)  
**Estimate:** 2 hours  
**Actual:** ~2 hours  

## Overview

This story establishes the foundation for the relational database access tool by setting up Drizzle ORM dependencies, configuring database drivers as peer dependencies, and creating the initial project structure.

## What Was Implemented

### 1. Dependencies Configuration

**Drizzle ORM Core Dependencies:**
- `drizzle-orm@^0.45.1` - Core ORM functionality
- `drizzle-kit@^0.31.9` - Schema management and migrations

**Peer Dependencies (Optional):**
- `pg@^8.0.0` - PostgreSQL driver
- `mysql2@^3.0.0` - MySQL driver
- `better-sqlite3@^9.0.0 || ^10.0.0 || ^11.0.0 || ^12.0.0` - SQLite driver

**Dev Dependencies (for testing):**
- `pg@^8.18.0` + `@types/pg@^8.16.0`
- `mysql2@^3.17.2`
- `better-sqlite3@^12.6.2` + `@types/better-sqlite3@^7.6.13`

### 2. Directory Structure

Created organized module structure under `packages/tools/src/data/relational/`:

```
relational/
├── connection/     # Database connection management
├── query/          # Query execution and CRUD operations
├── schema/         # Schema introspection and metadata
├── tools/          # LangGraph tool implementations
├── utils/          # Utility functions
├── types.ts        # Shared TypeScript types
└── index.ts        # Main module exports
```

### 3. Core Types

Defined foundational types in `types.ts`:
- `DatabaseVendor` - Supported database types (postgresql, mysql, sqlite)
- `DatabaseConfig` - Connection configuration interface
- `DatabaseConnection` - Connection interface contract
- `QueryMetadata` - Query execution metadata
- `QueryResult<T>` - Generic query result wrapper

### 4. Peer Dependency Runtime Checker

Implemented `utils/peer-dependency-checker.ts` with:
- Runtime validation of required peer dependencies
- Helpful error messages with installation instructions
- Vendor-specific package mapping
- Custom `MissingPeerDependencyError` class

**Example error message:**
```
Missing peer dependency for postgresql database.

The 'pg' package is required but not installed.

To fix this, install the required peer dependency:
  pnpm add pg @types/pg

For more information, see the @agentforge/tools documentation.
```

### 5. Documentation Updates

Updated `packages/tools/README.md` with:
- New "Optional Peer Dependencies" section
- Installation instructions for each database driver
- Clear guidance on installing only needed drivers

## Key Decisions

### Peer Dependency Strategy

**Decision:** Configure database drivers as optional peer dependencies rather than regular dependencies.

**Rationale:**
- **Prevents bloat:** Users only install drivers they need
- **Reduces bundle size:** No unused database drivers in production
- **Flexibility:** Supports different database vendors without forcing all dependencies
- **Best practice:** Follows npm/pnpm peer dependency patterns

**Implementation:**
- Drivers listed in `peerDependencies` with version ranges
- All drivers marked as `optional: true` in `peerDependenciesMeta`
- Runtime checker provides helpful errors when missing
- Dev dependencies ensure testing works out of the box

### Version Ranges

**PostgreSQL (`pg`):** `^8.0.0`
- Stable API since v8.x
- Wide compatibility

**MySQL (`mysql2`):** `^3.0.0`
- Latest major version with Promise support
- Better performance than legacy mysql package

**SQLite (`better-sqlite3`):** `^9.0.0 || ^10.0.0 || ^11.0.0 || ^12.0.0`
- Broader range due to frequent releases
- All versions have compatible APIs
- Ensures compatibility with various Node.js versions

## Verification

✅ **Dependencies installed successfully**
- All packages resolved without conflicts
- pnpm lockfile updated

✅ **TypeScript type resolution**
- Build completed successfully
- Drizzle ORM types properly resolved
- No type errors

✅ **Peer dependency checker**
- Error messages display correctly
- Installation instructions are helpful
- Vendor mapping works as expected

✅ **Build verification**
- `pnpm build` succeeded across all packages
- No compilation errors
- Type definitions generated correctly

## Next Steps

The foundation is now in place for implementing:
1. **ST-01002:** Connection Manager implementation
2. **ST-01003:** Connection pooling
3. **ST-01004:** Connection lifecycle management

## Files Changed

- `packages/tools/package.json` - Added dependencies and peer dependencies
- `packages/tools/src/data/relational/` - Created directory structure
- `packages/tools/src/data/relational/types.ts` - Shared types
- `packages/tools/src/data/relational/utils/peer-dependency-checker.ts` - Runtime checker
- `packages/tools/src/data/relational/index.ts` - Module exports
- `packages/tools/src/data/index.ts` - Export relational module
- `packages/tools/README.md` - Documentation updates
- `planning/checklists/epic-01-story-tasks.md` - Checklist tracking
- `planning/kanban-queue.md` - Story status updates

