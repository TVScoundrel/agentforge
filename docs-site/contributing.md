# Contributing to AgentForge

Thank you for your interest in contributing to AgentForge! This guide will help you get started.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**When filing a bug report, include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Code samples or test cases
- Environment details (Node version, OS, package versions)
- Error messages and stack traces

[Create a bug report](https://github.com/TVScoundrel/agentforge/issues/new?labels=bug)

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been suggested
- Provide a clear use case
- Explain why this feature would be useful
- Consider implementation details

[Suggest a feature](https://github.com/TVScoundrel/agentforge/issues/new?labels=enhancement)

### Improving Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples or tutorials
- Improve API documentation
- Translate documentation

### Contributing Code

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/agentforge.git
   cd agentforge
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

6. **Run tests**
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `refactor:` - Code refactoring
   - `chore:` - Maintenance tasks

8. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure all CI checks pass

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Project Structure
```
agentforge/
├── packages/
│   ├── core/          # Core abstractions
│   ├── patterns/      # Agent patterns
│   ├── cli/           # CLI tool
│   ├── testing/       # Testing utilities
│   └── tools/         # Built-in tools
├── docs-site/         # Documentation site
└── examples/          # Example projects
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
cd packages/core
pnpm build
```

### Documentation
```bash
# Start docs dev server
cd docs-site
pnpm dev

# Build docs
pnpm build

# Preview built docs
pnpm preview
```

## Style Guide

### TypeScript
- Use TypeScript for all code
- Provide proper type annotations
- Avoid `any` types
- Use Zod for runtime validation

### Code Style
- Follow the ESLint configuration
- Use Prettier for formatting
- Write descriptive variable and function names
- Add JSDoc comments for public APIs

### Testing
- Write tests for all new features
- Aim for high test coverage
- Use descriptive test names
- Test edge cases and error conditions

## Pull Request Process

1. **Update documentation** for any user-facing changes
2. **Add tests** for new functionality
3. **Ensure all tests pass** and linting is clean
4. **Update the changelog** if applicable
5. **Request review** from maintainers
6. **Address feedback** promptly and professionally

## Questions?

- [GitHub Discussions](https://github.com/TVScoundrel/agentforge/discussions)
- [Discord Server](https://discord.gg/agentforge)
- Email: contribute@agentforge.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AgentForge! 🎉**

