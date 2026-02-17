# Peer Dependencies Strategy

## Overview

The relational database tools use a **peer dependency pattern** for database drivers to prevent bloating user installations. Users only install the database drivers they actually need.

## Rationale

**Problem:** If we include all database drivers as regular dependencies:
- PostgreSQL-only users would download MySQL and SQLite drivers unnecessarily
- MySQL-only users would download PostgreSQL and SQLite drivers unnecessarily
- Increases bundle size and installation time
- Wastes disk space and bandwidth

**Solution:** Make database drivers peer dependencies:
- Users explicitly install only the drivers they need
- Smaller installation footprint
- Faster installation
- Clear dependency management

## Package.json Configuration

### Dependencies (Required)
```json
{
  "dependencies": {
    "drizzle-orm": "^0.x.x",
    "drizzle-kit": "^0.x.x"
  }
}
```

### Peer Dependencies (User Installs)
```json
{
  "peerDependencies": {
    "pg": "^8.11.0",
    "mysql2": "^3.6.0",
    "better-sqlite3": "^9.2.0"
  },
  "peerDependenciesMeta": {
    "pg": { "optional": true },
    "mysql2": { "optional": true },
    "better-sqlite3": { "optional": true }
  }
}
```

### Dev Dependencies (For Testing)
```json
{
  "devDependencies": {
    "pg": "^8.11.0",
    "@types/pg": "^8.10.0",
    "mysql2": "^3.6.0",
    "better-sqlite3": "^9.2.0",
    "@types/better-sqlite3": "^7.6.0"
  }
}
```

## User Installation Instructions

### PostgreSQL Only
```bash
pnpm add @agentforge/tools
pnpm add pg @types/pg
```

### MySQL Only
```bash
pnpm add @agentforge/tools
pnpm add mysql2
```

### SQLite Only
```bash
pnpm add @agentforge/tools
pnpm add better-sqlite3 @types/better-sqlite3
```

### Multiple Databases
```bash
pnpm add @agentforge/tools
pnpm add pg @types/pg mysql2 better-sqlite3 @types/better-sqlite3
```

## Runtime Validation

The connection manager will check for the required peer dependency at runtime:

```typescript
// packages/tools/src/data/relational/utils/peer-dependency-checker.ts

export function checkPeerDependency(vendor: DatabaseVendor): void {
  let packageName: string;
  
  switch (vendor) {
    case 'postgresql':
      packageName = 'pg';
      break;
    case 'mysql':
      packageName = 'mysql2';
      break;
    case 'sqlite':
      packageName = 'better-sqlite3';
      break;
  }
  
  try {
    require.resolve(packageName);
  } catch (error) {
    throw new Error(
      `Missing peer dependency: ${packageName}\n` +
      `To use ${vendor}, install the required driver:\n` +
      `  pnpm add ${packageName}${vendor === 'postgresql' || vendor === 'sqlite' ? ' @types/' + packageName : ''}\n` +
      `See documentation: https://github.com/TVScoundrel/agentforge/tree/main/packages/tools/src/data/relational`
    );
  }
}
```

## Error Messages

When a user tries to connect without the required driver:

```
Error: Missing peer dependency: pg

To use postgresql, install the required driver:
  pnpm add pg @types/pg

See documentation: https://github.com/TVScoundrel/agentforge/tree/main/packages/tools/src/data/relational
```

## Documentation Requirements

1. **README.md** - Clear installation instructions for each database
2. **API Documentation** - Mention peer dependencies in connection examples
3. **Error Messages** - Helpful, actionable error messages
4. **Examples** - Show installation commands before code examples

## Testing Strategy

- **Unit Tests:** Mock database drivers (no peer deps needed)
- **Integration Tests:** All drivers installed as dev dependencies
- **CI/CD:** Install all drivers for comprehensive testing
- **Local Development:** Developers install all drivers

## Benefits

✅ **Smaller installations** - Users only download what they need
✅ **Faster installs** - Less to download and install
✅ **Clear dependencies** - Explicit about what's required
✅ **Flexible** - Easy to add new database vendors
✅ **Standard pattern** - Common in the Node.js ecosystem (e.g., TypeORM, Prisma)

## Implementation Checklist

- [ ] Configure peer dependencies in package.json
- [ ] Mark all peer dependencies as optional
- [ ] Install all drivers as dev dependencies
- [ ] Implement peer dependency checker utility
- [ ] Add runtime validation in connection manager
- [ ] Write clear error messages
- [ ] Update README with installation instructions
- [ ] Add installation commands to all examples
- [ ] Test error messages by removing drivers
- [ ] Document in API reference

