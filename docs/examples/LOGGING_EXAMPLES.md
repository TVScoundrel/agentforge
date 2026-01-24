# Logging Examples by Pattern

This document provides concrete examples of how to add logging to each AgentForge pattern.

## Table of Contents

- [ReAct Pattern](#react-pattern)
- [Plan-Execute Pattern](#plan-execute-pattern)
- [Multi-Agent Pattern](#multi-agent-pattern)
- [Reflection Pattern](#reflection-pattern)
- [Custom Nodes](#custom-nodes)

---

## ReAct Pattern

### Reasoning Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:react:reasoning');

export function createReasoningNode(config: ReasoningNodeConfig) {
  return async (state: ReActState): Promise<Partial<ReActState>> => {
    const startTime = Date.now();
    
    logger.debug('Reasoning iteration started', {
      iteration: state.iteration,
      maxIterations: config.maxIterations,
      observationCount: state.observations?.length || 0,
      hasActions: !!state.actions
    });
    
    try {
      // Generate thought and actions
      const response = await config.model.invoke(messages);
      
      logger.info('Reasoning complete', {
        iteration: state.iteration,
        thoughtGenerated: !!thought,
        actionCount: actions.length,
        duration: Date.now() - startTime
      });
      
      return { thought, actions };
      
    } catch (error) {
      logger.error('Reasoning failed', {
        iteration: state.iteration,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

### Action Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:react:action');

export function createActionNode(config: ActionNodeConfig) {
  return async (state: ReActState): Promise<Partial<ReActState>> => {
    const startTime = Date.now();
    const actions = state.actions || [];
    
    logger.debug('Action node started', {
      iteration: state.iteration,
      actionCount: actions.length,
      cacheEnabled: config.enableDeduplication
    });
    
    // Build deduplication cache
    if (config.enableDeduplication) {
      logger.debug('Building deduplication cache', {
        observationCount: state.observations?.length || 0
      });
    }
    
    const observations: ToolObservation[] = [];
    let toolsExecuted = 0;
    let duplicatesSkipped = 0;
    
    for (const action of actions) {
      // Check cache
      if (config.enableDeduplication && cache.has(cacheKey)) {
        duplicatesSkipped++;
        logger.debug('Cache hit', {
          toolName: action.name,
          cacheKey,
          iteration: state.iteration
        });
        observations.push(cache.get(cacheKey)!);
        continue;
      }
      
      // Execute tool
      logger.debug('Executing tool', {
        toolName: action.name,
        args: action.args,
        iteration: state.iteration
      });
      
      try {
        const result = await tool.execute(action.args);
        toolsExecuted++;
        
        logger.debug('Tool executed successfully', {
          toolName: action.name,
          resultLength: result.length,
          iteration: state.iteration
        });
        
        observations.push({ ...action, result });
        
      } catch (error) {
        logger.error('Tool execution failed', {
          toolName: action.name,
          error: error.message,
          iteration: state.iteration
        });
        
        observations.push({ ...action, result: `Error: ${error.message}` });
      }
    }
    
    logger.info('Action node complete', {
      iteration: state.iteration,
      toolsExecuted,
      duplicatesSkipped,
      observationCount: observations.length,
      deduplicationSavings: calculateSavings(duplicatesSkipped, toolsExecuted),
      duration: Date.now() - startTime
    });
    
    return { observations };
  };
}
```

---

## Plan-Execute Pattern

### Planner Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:plan-execute:planner');

export function createPlannerNode(config: PlannerConfig) {
  return async (state: PlanExecuteState): Promise<Partial<PlanExecuteState>> => {
    const startTime = Date.now();
    
    logger.debug('Generating plan', {
      input: state.input.substring(0, 100),
      maxSteps: config.maxSteps,
      hasExistingPlan: !!state.plan
    });
    
    try {
      const response = await config.model.invoke(messages);
      const plan = parsePlan(response);
      
      logger.info('Plan generated', {
        stepCount: plan.steps.length,
        steps: plan.steps.map(s => s.description),
        duration: Date.now() - startTime
      });
      
      return { plan };
      
    } catch (error) {
      logger.error('Plan generation failed', {
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

### Executor Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:plan-execute:executor');

export function createExecutorNode(config: ExecutorConfig) {
  return async (state: PlanExecuteState): Promise<Partial<PlanExecuteState>> => {
    const startTime = Date.now();
    const currentStepIndex = state.pastSteps.length;
    const currentStep = state.plan.steps[currentStepIndex];
    
    logger.debug('Executing step', {
      stepIndex: currentStepIndex,
      totalSteps: state.plan.steps.length,
      stepDescription: currentStep.description,
      cacheEnabled: config.enableDeduplication
    });
    
    // Check cache
    if (config.enableDeduplication && cache.has(cacheKey)) {
      logger.debug('Cache hit for step', {
        stepIndex: currentStepIndex,
        cacheKey
      });
      
      return { pastSteps: [...state.pastSteps, cachedStep] };
    }
    
    try {
      const result = await executeStep(currentStep);
      
      logger.info('Step executed', {
        stepIndex: currentStepIndex,
        success: result.success,
        resultLength: result.result.length,
        fromCache: false,
        duration: Date.now() - startTime
      });
      
      return { pastSteps: [...state.pastSteps, result] };
      
    } catch (error) {
      logger.error('Step execution failed', {
        stepIndex: currentStepIndex,
        stepDescription: currentStep.description,
        error: error.message,
        duration: Date.now() - startTime
      });
      
      return {
        pastSteps: [...state.pastSteps, {
          step: currentStep,
          result: `Error: ${error.message}`,
          success: false
        }]
      };
    }
  };
}
```

---

## Multi-Agent Pattern

### Supervisor Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:multi-agent:supervisor');

export function createSupervisorNode(config: SupervisorConfig) {
  return async (state: MultiAgentState): Promise<Partial<MultiAgentState>> => {
    const startTime = Date.now();
    
    logger.info('Supervisor node executing', {
      iteration: state.iteration,
      maxIterations: config.maxIterations,
      activeAssignments: state.activeAssignments.length,
      completedTasks: state.completedTasks.length
    });
    
    // Check max iterations
    if (state.iteration >= config.maxIterations) {
      logger.warn('Max iterations reached', {
        iteration: state.iteration,
        maxIterations: config.maxIterations
      });
      
      return { status: 'aggregating', currentAgent: 'aggregator' };
    }
    
    // Get routing decision
    logger.debug('Getting routing strategy', {
      strategy: config.strategy,
      availableWorkers: Object.keys(state.workers).length
    });
    
    const decision = await routingStrategy.route(state, config);
    
    logger.debug('Routing decision made', {
      strategy: decision.strategy,
      targetAgent: decision.targetAgent,
      targetAgents: decision.targetAgents,
      reasoning: decision.reasoning,
      confidence: decision.confidence
    });
    
    // Create task assignments
    const assignments = createAssignments(decision, state);
    
    logger.info('Tasks assigned', {
      assignmentCount: assignments.length,
      workerIds: assignments.map(a => a.workerId),
      duration: Date.now() - startTime
    });
    
    return {
      activeAssignments: [...state.activeAssignments, ...assignments],
      currentAgent: decision.targetAgent || decision.targetAgents!.join(',')
    };
  };
}
```

### Worker Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:multi-agent:worker');

export function createWorkerNode(config: WorkerConfig) {
  return async (state: MultiAgentState): Promise<Partial<MultiAgentState>> => {
    const startTime = Date.now();
    const assignment = state.activeAssignments.find(a => a.workerId === config.id);
    
    if (!assignment) {
      logger.debug('No active assignment', {
        workerId: config.id,
        activeAssignments: state.activeAssignments.length
      });
      return {};
    }
    
    logger.debug('Worker executing task', {
      workerId: config.id,
      taskId: assignment.id,
      task: assignment.task.substring(0, 100),
      executionMode: config.agent ? 'react-agent' : 'llm-direct'
    });
    
    try {
      const result = await executeTask(assignment, config);
      
      logger.info('Worker task complete', {
        workerId: config.id,
        taskId: assignment.id,
        resultLength: result.length,
        duration: Date.now() - startTime
      });
      
      return {
        completedTasks: [...state.completedTasks, {
          assignmentId: assignment.id,
          workerId: config.id,
          result,
          completedAt: Date.now()
        }]
      };
      
    } catch (error) {
      logger.error('Worker task failed', {
        workerId: config.id,
        taskId: assignment.id,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

---

## Reflection Pattern

### Generator Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:reflection:generator');

export function createGeneratorNode(config: GeneratorConfig) {
  return async (state: ReflectionState): Promise<Partial<ReflectionState>> => {
    const startTime = Date.now();
    
    logger.debug('Generating response', {
      attempt: state.iteration,
      maxAttempts: config.maxAttempts,
      hasFeedback: !!state.reflection,
      hasExistingResponse: !!state.response
    });
    
    try {
      const response = await config.model.invoke(messages);
      const content = extractContent(response);
      
      logger.info('Response generated', {
        attempt: state.iteration,
        responseLength: content.length,
        isRevision: !!state.reflection,
        duration: Date.now() - startTime
      });
      
      return { response: content };
      
    } catch (error) {
      logger.error('Response generation failed', {
        attempt: state.iteration,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

### Reflector Node

```typescript
import { createPatternLogger } from '@agentforge/patterns';

const logger = createPatternLogger('agentforge:patterns:reflection:reflector');

export function createReflectorNode(config: ReflectorConfig) {
  return async (state: ReflectionState): Promise<Partial<ReflectionState>> => {
    const startTime = Date.now();
    
    logger.debug('Reflecting on response', {
      attempt: state.iteration,
      responseLength: state.response.length,
      criteria: config.criteria
    });
    
    try {
      const response = await config.model.invoke(messages);
      const reflection = parseReflection(response);
      
      logger.info('Reflection complete', {
        attempt: state.iteration,
        score: reflection.score,
        meetsStandards: reflection.meetsStandards,
        feedbackLength: reflection.feedback.length,
        duration: Date.now() - startTime
      });
      
      return { reflection };
      
    } catch (error) {
      logger.error('Reflection failed', {
        attempt: state.iteration,
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

---

## Custom Nodes

### Template for Custom Nodes

```typescript
import { createPatternLogger } from '@agentforge/patterns';

// Create logger with descriptive hierarchical name
const logger = createPatternLogger('agentforge:custom:my-pattern:my-node');

export function createMyCustomNode(config: MyNodeConfig) {
  return async (state: MyState): Promise<Partial<MyState>> => {
    const startTime = Date.now();
    
    // Log entry with relevant context
    logger.debug('Node execution started', {
      // Include IDs, counts, iteration numbers
      iteration: state.iteration,
      itemCount: state.items?.length || 0,
      configOption: config.someOption
    });
    
    try {
      // Your node logic here
      
      // Log expensive operations only if debug enabled
      if (logger.isDebugEnabled()) {
        const expensiveData = computeExpensiveDebugInfo();
        logger.debug('Detailed state', expensiveData);
      }
      
      // Log successful completion with metrics
      logger.info('Node execution complete', {
        iteration: state.iteration,
        itemsProcessed: result.length,
        duration: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      // Log errors with context
      logger.error('Node execution failed', {
        iteration: state.iteration,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });
      throw error;
    }
  };
}
```

---

## Best Practices Summary

1. **Create logger at module level** with hierarchical name
2. **Log at DEBUG** for detailed execution flow
3. **Log at INFO** for high-level milestones and metrics
4. **Log at WARN** for recoverable issues
5. **Log at ERROR** for failures
6. **Include context**: IDs, counts, iteration numbers, timing
7. **Use `isDebugEnabled()`** for expensive computations
8. **Measure duration** for performance-critical operations
9. **Don't log sensitive data** (API keys, passwords, PII)
10. **Test your logging** to ensure it appears correctly

---

## Enabling Debug Logging

```bash
# Enable debug logging for all patterns
LOG_LEVEL=debug npm start

# Enable debug logging for specific pattern
LOG_LEVEL=debug:agentforge:patterns:react npm start

# Production: only INFO and above
LOG_LEVEL=info npm start
```

