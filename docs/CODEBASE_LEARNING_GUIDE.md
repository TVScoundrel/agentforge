# AgentForge Codebase Learning Guide

> A structured guide to understanding the AgentForge framework architecture

**Created**: January 7, 2026  
**Purpose**: Help developers understand the codebase before contributing to Phase 7

---

## 🎯 Learning Objectives

By the end of this guide, you should understand:
1. **Core Architecture** - How agents, tools, and patterns work together
2. **Package Structure** - What each package does and how they interact
3. **Key Patterns** - ReAct, Plan-Execute, Reflection, Multi-Agent
4. **Extension Points** - Where and how to add new functionality
5. **Testing Strategy** - How the framework is tested

---

## 📚 Recommended Learning Path

### Level 1: High-Level Overview (30-60 minutes)

**Goal**: Understand what AgentForge is and what it does

1. **Start Here**:
   - [ ] Read `README.md` - Project overview
   - [ ] Read `docs/ROADMAP.md` (lines 1-100) - What's been built
   - [ ] Read `docs/FRAMEWORK_DESIGN.md` - Architecture overview

2. **Explore Examples**:
   - [ ] Browse `examples/applications/` - See real applications
   - [ ] Look at `examples/integrations/` - Framework integrations
   - [ ] Check `templates/` - Project templates

3. **Quick Reference**:
   - [ ] Skim `docs/QUICK_REFERENCE.md` - API cheat sheet

**Key Questions to Answer**:
- What problem does AgentForge solve?
- What are the main components (core, patterns, tools, cli)?
- How do agents differ from traditional functions?

---

### Level 2: Core Concepts (1-2 hours)

**Goal**: Understand the fundamental building blocks

#### 2.1 Core Package (`packages/core/`)

**Start with**:
```bash
# View the core package structure
ls -la packages/core/src/
```

**Files to read** (in order):
1. [ ] `packages/core/src/types/agent.ts` - Agent type definitions
2. [ ] `packages/core/src/types/tool.ts` - Tool type definitions
3. [ ] `packages/core/src/agent/BaseAgent.ts` - Base agent implementation
4. [ ] `packages/core/src/agent/AgentExecutor.ts` - How agents execute
5. [ ] `packages/core/src/state/StateManager.ts` - State management

**Key Questions**:
- What is an `Agent`? What properties does it have?
- What is a `Tool`? How are tools defined?
- How does state flow through an agent?
- What's the difference between `BaseAgent` and `AgentExecutor`?

#### 2.2 Tools Package (`packages/tools/`)

**Files to read**:
1. [ ] `packages/tools/src/registry/ToolRegistry.ts` - Tool registration
2. [ ] `packages/tools/src/builder/ToolBuilder.ts` - Tool creation
3. [ ] `packages/tools/src/standard/` - Browse standard tools
4. [ ] `packages/tools/src/validation/` - Tool validation

**Key Questions**:
- How are tools registered and discovered?
- How do you create a new tool?
- What validation happens on tools?
- What standard tools are available?

---

### Level 3: Agent Patterns (2-3 hours)

**Goal**: Understand the 4 core agent patterns

#### 3.1 ReAct Pattern

**Files to read**:
1. [ ] `packages/patterns/src/react/ReactAgent.ts` - ReAct implementation
2. [ ] `packages/patterns/src/react/ReactGraph.ts` - LangGraph integration
3. [ ] `examples/applications/react-agent/` - Example application

**Key Questions**:
- What is the ReAct loop (Reason → Act → Observe)?
- How does the agent decide which tool to use?
- When does the agent stop?

#### 3.2 Plan-Execute Pattern

**Files to read**:
1. [ ] `packages/patterns/src/plan-execute/PlanExecuteAgent.ts`
2. [ ] `packages/patterns/src/plan-execute/PlanExecuteGraph.ts`
3. [ ] `examples/applications/plan-execute-agent/` - Example

**Key Questions**:
- How does planning differ from ReAct?
- What is a "plan" and how is it structured?
- How does execution follow the plan?

#### 3.3 Reflection Pattern

**Files to read**:
1. [ ] `packages/patterns/src/reflection/ReflectionAgent.ts`
2. [ ] `packages/patterns/src/reflection/ReflectionGraph.ts`

**Key Questions**:
- What is reflection and why is it useful?
- How does the agent critique its own work?
- When does reflection stop?

#### 3.4 Multi-Agent Pattern

**Files to read**:
1. [ ] `packages/patterns/src/multi-agent/MultiAgentOrchestrator.ts`
2. [ ] `packages/patterns/src/multi-agent/AgentTeam.ts`

**Key Questions**:
- How do multiple agents coordinate?
- What is an orchestrator?
- How is state shared between agents?

---

### Level 4: Testing & Quality (1-2 hours)

**Goal**: Understand how the framework is tested

#### 4.1 Testing Package

**Files to read**:
1. [ ] `packages/testing/src/mocks/MockLLM.ts` - Mock LLM for testing
2. [ ] `packages/testing/src/fixtures/` - Test fixtures
3. [ ] `packages/testing/src/helpers/` - Test helpers

#### 4.2 Example Tests

**Files to read**:
1. [ ] `packages/core/src/__tests__/` - Core tests
2. [ ] `packages/patterns/src/__tests__/` - Pattern tests
3. [ ] `packages/tools/src/__tests__/` - Tool tests

**Key Questions**:
- How are agents tested without real LLMs?
- What test patterns are used?
- How is async behavior tested?

---

### Level 5: CLI & Developer Experience (1 hour)

**Goal**: Understand the developer tools

**Files to read**:
1. [ ] `packages/cli/src/commands/` - CLI commands
2. [ ] `packages/cli/src/generators/` - Code generators
3. [ ] `templates/` - Project templates

**Key Questions**:
- What can the CLI do?
- How are new projects scaffolded?
- What templates are available?

---

## 🔍 Deep Dive Topics

### Advanced Topic 1: LangGraph Integration

**When**: After Level 3

**Files to explore**:
- `packages/patterns/src/*/graph.ts` - Graph implementations
- `packages/core/src/langgraph/` - LangGraph adapters

**Questions**:
- How does AgentForge use LangGraph?
- What is a StateGraph?
- How are nodes and edges defined?

### Advanced Topic 2: Middleware System

**When**: After Level 4

**Files to explore**:
- `packages/core/src/middleware/` - Middleware system
- Look for middleware examples in patterns

**Questions**:
- What is middleware in AgentForge?
- How does it intercept agent execution?
- What middleware is built-in?

---

## 🎓 Hands-On Exercises

### Exercise 1: Create a Simple Tool (30 min)

**Goal**: Understand tool creation

1. Create a new tool in `packages/tools/src/standard/`
2. Register it in the tool registry
3. Write tests for it
4. Use it in a ReAct agent

### Exercise 2: Build a Custom Agent (1 hour)

**Goal**: Understand agent patterns

1. Create a simple agent using the ReAct pattern
2. Give it 2-3 tools
3. Test it with different prompts
4. Add logging to see the decision-making

### Exercise 3: Extend a Pattern (1-2 hours)

**Goal**: Understand pattern internals

1. Pick a pattern (ReAct or Plan-Execute)
2. Add a custom callback or hook
3. Modify the graph to add a new node
4. Test the modified pattern

---

## 📊 Architecture Diagrams

**Visual learners**: Check these out!

1. [ ] `docs/DIAGRAMS.md` - All architecture diagrams
2. [ ] `docs/FRAMEWORK_DESIGN.md` - Design decisions

---

## ✅ Readiness Checklist

Before starting Phase 7, you should be able to:

- [ ] Explain what an Agent is and how it differs from a function
- [ ] Describe the 4 core patterns and when to use each
- [ ] Create a new tool from scratch
- [ ] Understand how LangGraph integrates with AgentForge
- [ ] Navigate the codebase confidently
- [ ] Run and modify existing examples
- [ ] Write tests for new functionality
- [ ] Explain how multi-agent coordination currently works

---

## 🚀 Ready for Phase 7?

**If you can answer these questions, you're ready**:

1. How would you implement agent-to-agent communication?
2. What state needs to be shared between agents?
3. How would you handle agent failures in a team?
4. What patterns from the existing codebase can be reused?
5. How would you test a supervisor-worker pattern?

**If not**: Spend more time on Level 3 (Agent Patterns) and Advanced Topic 1 (LangGraph Integration)

---

## 📚 Additional Resources

- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **Vitest Docs**: https://vitest.dev/
- **Existing Phase Docs**: Check `docs/PHASE_*_COMPLETE.md` files

---

**Happy Learning!** 🎉

When you're ready to start Phase 7, you'll have a solid foundation to build advanced multi-agent orchestration patterns.


