/**
 * Prompts for Reflection Pattern
 *
 * This module contains prompt templates for the Reflection pattern.
 *
 * @module patterns/reflection/prompts
 */

/**
 * Default system prompt for the generator
 */
export const DEFAULT_GENERATOR_SYSTEM_PROMPT = `You are an expert content generator. Your task is to create high-quality responses to user requests.

Focus on:
- Clarity and coherence
- Accuracy and correctness
- Completeness and thoroughness
- Appropriate tone and style

Generate the best possible response to the user's request.`;

/**
 * Default system prompt for the reflector
 */
export const DEFAULT_REFLECTOR_SYSTEM_PROMPT = `You are an expert critic and reviewer. Your task is to provide constructive feedback on responses.

Evaluate the response based on:
- Clarity: Is it easy to understand?
- Accuracy: Is the information correct?
- Completeness: Does it fully address the request?
- Quality: Is it well-written and professional?

Provide specific, actionable feedback for improvement.`;

/**
 * Default system prompt for the reviser
 */
export const DEFAULT_REVISER_SYSTEM_PROMPT = `You are an expert editor and reviser. Your task is to improve responses based on feedback.

Focus on:
- Addressing all identified issues
- Implementing suggested improvements
- Maintaining the core message
- Enhancing overall quality

Create an improved version that addresses the critique.`;

/**
 * Template for generation prompt
 */
export const GENERATION_PROMPT_TEMPLATE = `Please generate a response to the following request:

{input}

{context}

Provide a high-quality, complete response.`;

/**
 * Template for reflection prompt
 */
export const REFLECTION_PROMPT_TEMPLATE = `Please review and critique the following response:

Original Request:
{input}

Current Response:
{currentResponse}

{criteria}

{history}

Provide a detailed critique including:
1. What works well
2. Specific issues or problems
3. Suggestions for improvement
4. A quality score (0-10)
5. Whether it meets quality standards

Format your response as JSON with the following structure:
{
  "critique": "overall assessment",
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "score": 8,
  "meetsStandards": true
}`;

/**
 * Template for revision prompt
 */
export const REVISION_PROMPT_TEMPLATE = `Please revise the following response based on the critique:

Original Request:
{input}

Current Response:
{currentResponse}

Critique:
{critique}

Issues to Address:
{issues}

Suggestions:
{suggestions}

{history}

Create an improved version that addresses all the feedback while maintaining the core message.`;

/**
 * Template for quality criteria
 */
export const QUALITY_CRITERIA_TEMPLATE = `Evaluate against these specific criteria:
{criteria}

Minimum required score: {minScore}/10
{requireAll}`;

/**
 * Template for reflection history
 */
export const REFLECTION_HISTORY_TEMPLATE = `Previous Reflections:
{reflections}

Previous Revisions:
{revisions}`;

/**
 * Template for formatting a single reflection
 */
export const REFLECTION_ENTRY_TEMPLATE = `Iteration {iteration}:
Critique: {critique}
Score: {score}/10
Issues: {issues}
Suggestions: {suggestions}`;

/**
 * Template for formatting a single revision
 */
export const REVISION_ENTRY_TEMPLATE = `Iteration {iteration}:
{content}`;

