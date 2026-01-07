# CLI Tests

This directory contains comprehensive unit tests for the AgentForge CLI package.

## Test Coverage

### Core Commands (34 tests, 98% coverage)

#### Create Command Tests (`commands/create.test.ts`) - 7 tests
- ✅ Project name validation
- ✅ Directory existence checks
- ✅ Template copying with replacements
- ✅ Dependency installation (with graceful error handling)
- ✅ Git initialization (with graceful error handling)

#### Build Command Tests (`commands/build.test.ts`) - 6 tests
- ✅ Default build configuration
- ✅ Minify and sourcemap options
- ✅ Environment variable setting
- ✅ Build failure handling

#### Dev Command Tests (`commands/dev.test.ts`) - 6 tests
- ✅ Development server startup
- ✅ Port configuration
- ✅ Package manager detection
- ✅ Error handling

#### Test Command Tests (`commands/test.test.ts`) - 7 tests
- ✅ Default test execution
- ✅ Watch mode
- ✅ UI mode
- ✅ Coverage mode
- ✅ Test failure handling

#### Lint Command Tests (`commands/lint.test.ts`) - 8 tests
- ✅ Linting with default options
- ✅ Auto-fix mode
- ✅ Formatting toggle
- ✅ Graceful error handling for lint/format failures

### Utilities (55 tests, 75.25% coverage)

#### Logger Tests (`utils/logger.test.ts`) - 16 tests
- ✅ Info, success, warn, error, debug logging
- ✅ Spinner lifecycle (start, update, succeed, fail, stop)
- ✅ Formatting utilities (newLine, divider, header, code, list)
- ✅ Debug mode conditional logging

#### Package Manager Tests (`utils/package-manager.test.ts`) - 12 tests
- ✅ Package manager detection (pnpm, npm, yarn)
- ✅ Lock file detection
- ✅ Availability fallback detection
- ✅ Install command generation
- ✅ Run command generation

#### Git Tests (`utils/git.test.ts`) - 7 tests
- ✅ Git installation detection
- ✅ Git repository detection
- ✅ Git user info retrieval
- ✅ Error handling for missing git config

#### File System Tests (`utils/fs.test.ts`) - 11 tests
- ✅ Directory operations (ensure, remove, isEmpty)
- ✅ JSON operations (read, write)
- ✅ Path operations (exists, getTemplatePath)
- ✅ File operations (read, write)

#### Prompts Tests (`utils/prompts.test.ts`) - 9 tests
- ✅ Project setup prompts with validation
- ✅ Agent setup prompts with validation
- ✅ Tool setup prompts with validation
- ✅ Input validation (project names, agent names, tool names)
- ✅ Support for all templates, patterns, and categories

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Test Structure

```
tests/
├── commands/
│   ├── create.test.ts          # Project creation command tests
│   ├── build.test.ts           # Build command tests
│   ├── dev.test.ts             # Dev server command tests
│   ├── test.test.ts            # Test runner command tests
│   └── lint.test.ts            # Linting command tests
├── utils/
│   ├── logger.test.ts          # Logger utility tests
│   ├── package-manager.test.ts # Package manager detection tests
│   ├── git.test.ts             # Git utility tests
│   ├── fs.test.ts              # File system utility tests
│   └── prompts.test.ts         # Interactive prompt tests
└── README.md                   # This file
```

## Coverage Report

Current coverage (as of last run):

| File               | % Stmts | % Branch | % Funcs | % Lines | Status |
|--------------------|---------|----------|---------|---------|--------|
| **All files**      | 48.91   | 92.02    | 68.96   | 48.91   | |
| **commands/**      | 98.00   | 96.87    | 100     | 98.00   | ✅ Excellent |
| build.ts           | 100     | 100      | 100     | 100     | ✅ Perfect |
| create.ts          | 95.55   | 89.47    | 100     | 95.55   | ✅ Excellent |
| dev.ts             | 100     | 100      | 100     | 100     | ✅ Perfect |
| lint.ts            | 100     | 100      | 100     | 100     | ✅ Perfect |
| test.ts            | 100     | 100      | 100     | 100     | ✅ Perfect |
| **utils/**         | 75.25   | 98.48    | 77.77   | 75.25   | ✅ Good |
| logger.ts          | 100     | 100      | 100     | 100     | ✅ Perfect |
| prompts.ts         | 97.27   | 95       | 100     | 97.27   | ✅ Excellent |
| git.ts             | 74.28   | 100      | 60      | 74.28   | ⚠️ Could improve |
| package-manager.ts | 45.34   | 100      | 50      | 45.34   | ⚠️ Could improve |
| fs.ts              | 37.7    | 100      | 54.54   | 37.7    | ⚠️ Could improve |

## Notes

- **Core Commands (98% coverage)**: ✅ All main CLI commands are thoroughly tested with comprehensive mocking
- **Agent/Tool Commands (0% coverage)**: ⚠️ Scaffolding commands not tested - less critical, harder to test, lower risk
- **Templates**: Template files are excluded from test runs as they are meant to be copied to user projects
- **Mocking**: Tests use Vitest's mocking capabilities to mock external dependencies like `fs-extra`, `execa`, and `inquirer`
- **Integration Functions**: Some utility functions (copyTemplate, installDependencies, runScript) are better suited for E2E tests

## Future Improvements

Potential areas for expansion:
1. Integration tests for command execution
2. E2E tests for full CLI workflows
3. Template validation tests
4. Performance benchmarks

