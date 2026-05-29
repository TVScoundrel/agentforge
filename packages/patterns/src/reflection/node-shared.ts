import { createPatternLogger } from '../shared/deduplication.js';
import { REVISION_ENTRY_TEMPLATE } from './prompts.js';

export const generatorLogger = createPatternLogger('agentforge:patterns:reflection:generator');
export const reflectorLogger = createPatternLogger('agentforge:patterns:reflection:reflector');
export const reviserLogger = createPatternLogger('agentforge:patterns:reflection:reviser');

export function serializeModelContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

export function buildRevisionHistorySection(
  revisions: Array<{ content: string; iteration: number }>,
  heading: string
): string {
  if (revisions.length === 0) {
    return '';
  }

  const revisionsText = revisions
    .map((revision) => REVISION_ENTRY_TEMPLATE
      .replace('{iteration}', revision.iteration.toString())
      .replace('{content}', `${revision.content.substring(0, 200)}...`)
    )
    .join('\n\n');

  return `\n${heading}:\n${revisionsText}`;
}
