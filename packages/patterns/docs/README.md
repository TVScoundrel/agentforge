# @agentforge/patterns Documentation

Comprehensive documentation for agent patterns in the AgentForge framework.

## Quick Links

- [Pattern Comparison Guide](./pattern-comparison.md) - Choose the right pattern
- [ReAct Pattern Guide](./react-agent-guide.md) - Complete ReAct documentation
- [Plan-Execute Pattern Guide](./plan-execute-pattern.md) - Complete Plan-Execute documentation

## Documentation Structure

### 📚 Pattern Guides

Comprehensive guides for each pattern:

#### ReAct Pattern
- **[ReAct Agent Guide](./react-agent-guide.md)** - Complete usage guide
  - Architecture and concepts
  - Configuration options
  - Usage patterns
  - Best practices
  - Troubleshooting

- **[ReAct Pattern Reference](./react-pattern.md)** - Technical reference
  - API documentation
  - State management
  - Node implementations
  - Advanced features

#### Plan-Execute Pattern
- **[Plan-Execute Pattern Guide](./plan-execute-pattern.md)** - Complete usage guide (1600+ lines)
  - Architecture and workflow
  - Core concepts
  - Usage patterns
  - Advanced features
  - Best practices
  - Troubleshooting

- **[Plan-Execute Quick Reference](./plan-execute-quick-reference.md)** - Quick reference
  - Common patterns
  - Configuration examples
  - Code snippets
  - Troubleshooting tips

#### Reflection Pattern
- **[Reflection Pattern](./reflection-pattern.md)** - Coming in Phase 3.3
  - Self-critique and improvement
  - Iterative refinement
  - Quality assessment

### 🔄 Pattern Comparison

- **[Pattern Comparison Guide](./pattern-comparison.md)** - Choose the right pattern
  - Decision tree
  - Detailed comparison
  - Use case examples
  - Migration guide
  - When to use each pattern

## Getting Started

### 1. Choose Your Pattern

Start with the [Pattern Comparison Guide](./pattern-comparison.md) to understand which pattern fits your use case:

- **ReAct**: For exploratory tasks, dynamic problem-solving, transparent reasoning
- **Plan-Execute**: For well-defined workflows, parallel execution, structured processes
- **Reflection**: For quality-critical tasks, iterative refinement (coming soon)

### 2. Read the Pattern Guide

Once you've chosen a pattern, read its comprehensive guide:

- [ReAct Agent Guide](./react-agent-guide.md)
- [Plan-Execute Pattern Guide](./plan-execute-pattern.md)

### 3. Explore Examples

Check out the examples directory for practical implementations:

- [ReAct Examples](../examples/react/)
- [Plan-Execute Examples](../examples/plan-execute/)

### 4. Build Your Agent

Use the quick reference guides for common patterns:

- [Plan-Execute Quick Reference](./plan-execute-quick-reference.md)

## Documentation by Topic

### Architecture

- [ReAct Architecture](./react-agent-guide.md#architecture)
- [Plan-Execute Architecture](./plan-execute-pattern.md#architecture)
- [Pattern Comparison](./pattern-comparison.md#architecture)

### Configuration

- [ReAct Configuration](./react-agent-guide.md#configuration)
- [Plan-Execute Configuration](./plan-execute-pattern.md#core-concepts)
- [Quick Reference](./plan-execute-quick-reference.md#configuration-options)

### Best Practices

- [ReAct Best Practices](./react-agent-guide.md#best-practices)
- [Plan-Execute Best Practices](./plan-execute-pattern.md#best-practices)
- [Pattern Selection](./pattern-comparison.md#when-to-use-each-pattern)

### Advanced Features

- [ReAct Advanced Features](./react-agent-guide.md#advanced-usage)
- [Plan-Execute Advanced Features](./plan-execute-pattern.md#advanced-features)
- [Custom Workflows](./plan-execute-pattern.md#usage-patterns)

### Troubleshooting

- [ReAct Troubleshooting](./react-agent-guide.md#troubleshooting)
- [Plan-Execute Troubleshooting](./plan-execute-pattern.md#troubleshooting)
- [Common Issues](./pattern-comparison.md#migration-guide)

## API Reference

### ReAct Pattern

```typescript
import {
  ReActAgentBuilder,
  createReActAgent,
  createReActAgentBuilder,
} from '@agentforge/patterns';
```

See: [ReAct Agent Guide](./react-agent-guide.md#api-reference)

### Plan-Execute Pattern

```typescript
import {
  createPlanExecuteAgent,
  createPlannerNode,
  createExecutorNode,
  createReplannerNode,
  createFinisherNode,
} from '@agentforge/patterns';
```

See: [Plan-Execute Pattern Guide](./plan-execute-pattern.md#api-reference)

## Examples

### ReAct Examples

Located in `examples/react/`:
- Basic ReAct agent
- Custom tools
- Advanced configuration
- Error handling

### Plan-Execute Examples

Located in `examples/plan-execute/`:
- Basic plan-execute
- Research tasks
- Complex planning with parallel execution
- Custom workflows

## Contributing to Documentation

We welcome documentation improvements! When contributing:

1. **Maintain consistency** with existing documentation style
2. **Include examples** for new features
3. **Update all relevant guides** when making changes
4. **Test code examples** to ensure they work
5. **Add to this index** when creating new documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide real-world use cases
- Add troubleshooting tips
- Link to related documentation

## Resources

### External Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Documentation](https://js.langchain.com/)
- [ReAct Paper](https://arxiv.org/abs/2210.03629)
- [Plan-and-Solve Paper](https://arxiv.org/abs/2305.04091)

### Internal Resources

- [Source Code](../src/)
- [Tests](../tests/)
- [Examples](../examples/)
- [Main README](../README.md)

## Version History

### v1.0.0 (Current)

**Patterns**:
- ✅ ReAct Pattern (Phase 3.1)
- ✅ Plan-Execute Pattern (Phase 3.2)
- 🚧 Reflection Pattern (Phase 3.3 - Coming Soon)

**Documentation**:
- Complete pattern guides
- Quick reference guides
- Pattern comparison guide
- Implementation summaries
- Comprehensive examples

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Need help?** Check the troubleshooting sections in each pattern guide or open an issue on GitHub.
