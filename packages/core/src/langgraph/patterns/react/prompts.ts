/**
 * Prompt templates for ReAct pattern
 *
 * @module langgraph/patterns/react/prompts
 */

/**
 * Default system prompt for ReAct agents
 */
export const DEFAULT_REACT_SYSTEM_PROMPT = `You are a helpful assistant that uses tools to solve problems.

You follow the ReAct (Reasoning and Action) pattern:
1. THINK: Reason about what to do next
2. ACT: Use a tool or provide a final answer
3. OBSERVE: Examine the tool's result
4. REPEAT: Continue until you can answer the user's question

When you need to use a tool:
- Think carefully about which tool to use
- Provide the correct arguments
- Wait for the observation before proceeding

When you have enough information:
- Provide a clear, complete answer
- Cite the tools you used if relevant`;

/**
 * Prompt template for the reasoning step
 */
export const REASONING_PROMPT_TEMPLATE = `Based on the conversation so far, think about what to do next.

Available tools:
{tools}

Current iteration: {iteration}/{maxIterations}

Previous thoughts:
{thoughts}

Previous actions and observations:
{scratchpad}

What should you do next? Think step by step.`;

/**
 * Prompt template for tool selection
 */
export const TOOL_SELECTION_PROMPT = `You have the following tools available:

{tools}

Based on your reasoning, which tool should you use? Respond with a JSON object:
{
  "tool": "tool-name",
  "arguments": { "arg1": "value1", ... },
  "reasoning": "why you chose this tool"
}

Or if you have enough information to answer, respond with:
{
  "final_answer": "your complete answer to the user's question"
}`;

/**
 * Format tools for prompt injection
 */
export function formatToolsForPrompt(tools: Array<{ name: string; description: string; schema: any }>): string {
  return tools
    .map((tool, index) => {
      return `${index + 1}. ${tool.name}: ${tool.description}`;
    })
    .join('\n');
}

/**
 * Format scratchpad for prompt injection
 */
export function formatScratchpad(scratchpad: Array<{ step: number; thought?: string; action?: string; observation?: string }>): string {
  if (scratchpad.length === 0) {
    return 'No previous steps.';
  }

  return scratchpad
    .map((entry) => {
      const parts: string[] = [`Step ${entry.step}:`];
      if (entry.thought) parts.push(`  Thought: ${entry.thought}`);
      if (entry.action) parts.push(`  Action: ${entry.action}`);
      if (entry.observation) parts.push(`  Observation: ${entry.observation}`);
      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Format thoughts for prompt injection
 */
export function formatThoughts(thoughts: Array<{ content: string }>): string {
  if (thoughts.length === 0) {
    return 'No previous thoughts.';
  }

  return thoughts
    .map((thought, index) => `${index + 1}. ${thought.content}`)
    .join('\n');
}

