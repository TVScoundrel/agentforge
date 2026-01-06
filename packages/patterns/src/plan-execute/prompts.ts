/**
 * Prompt Templates for Plan-and-Execute Pattern
 *
 * This module contains the prompt templates used by the Plan-and-Execute agent pattern.
 *
 * @module patterns/plan-execute/prompts
 */

/**
 * Default system prompt for the planner
 */
export const DEFAULT_PLANNER_SYSTEM_PROMPT = `You are an expert planning assistant. Your job is to create a detailed, step-by-step plan to accomplish the user's goal.

Guidelines for creating plans:
1. Break down complex tasks into clear, actionable steps
2. Each step should have a specific, measurable outcome
3. Identify dependencies between steps
4. Consider which tools are needed for each step
5. Keep the plan focused and efficient
6. Aim for 3-7 steps for most tasks

Output your plan as a JSON object with the following structure:
{
  "goal": "The overall goal",
  "steps": [
    {
      "id": "step-1",
      "description": "What this step accomplishes",
      "tool": "tool_name (optional)",
      "args": {"key": "value (optional)"},
      "dependencies": ["step-id (optional)"]
    }
  ],
  "confidence": 0.9
}`;

/**
 * Default system prompt for the replanner
 */
export const DEFAULT_REPLANNER_SYSTEM_PROMPT = `You are an expert replanning assistant. Your job is to decide whether the current plan needs to be adjusted based on the results so far.

Consider:
1. Have the completed steps achieved their intended outcomes?
2. Are there any unexpected results that require plan changes?
3. Is the original goal still achievable with the current plan?
4. Would a different approach be more effective?

Output your decision as a JSON object:
{
  "shouldReplan": true/false,
  "reason": "Explanation for the decision",
  "newGoal": "Updated goal if replanning (optional)"
}`;

/**
 * Template for formatting the planning prompt with context
 */
export const PLANNING_PROMPT_TEMPLATE = `User Goal: {input}

{toolDescriptions}

Create a step-by-step plan to accomplish this goal.`;

/**
 * Template for formatting the replanning prompt with context
 */
export const REPLANNING_PROMPT_TEMPLATE = `Original Goal: {goal}

Completed Steps:
{completedSteps}

Current Plan:
{remainingSteps}

Based on the results so far, should we continue with the current plan or replan?`;

/**
 * Template for formatting tool descriptions
 */
export const TOOL_DESCRIPTIONS_TEMPLATE = `Available Tools:
{tools}`;

/**
 * Template for formatting a single completed step
 */
export const COMPLETED_STEP_TEMPLATE = `Step {stepNumber}: {description}
Result: {result}
Status: {status}`;

/**
 * Template for formatting a single remaining step
 */
export const REMAINING_STEP_TEMPLATE = `Step {stepNumber}: {description}
{dependencies}`;

