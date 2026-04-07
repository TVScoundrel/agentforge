import type { JsonObject } from '../observability/payload.js';
import type {
  ApprovalRequiredInterrupt,
  CustomInterrupt,
  ResumeCommand,
  ResumeOptions,
} from './types.js';
import { createApprovalRequiredInterrupt, createCustomInterrupt } from './utils.js';

const customInterrupt = createCustomInterrupt(
  'custom-123',
  { action: 'review', flags: ['urgent'] },
  { source: 'manual' }
);

const typedCustomInterrupt: CustomInterrupt<
  { action: string; flags: string[] },
  { source: string }
> = customInterrupt;

void typedCustomInterrupt;

const approvalInterrupt: ApprovalRequiredInterrupt = createApprovalRequiredInterrupt(
  'delete-project',
  'Delete a project',
  { projectId: 'proj-1' }
);

void approvalInterrupt;

const resumeCommand: ResumeCommand<{ approved: boolean }, { actor: string }> = {
  resume: { approved: true },
  metadata: { actor: 'tom' },
};

const resumeOptions: ResumeOptions = {
  threadId: 'thread-1',
  interruptId: 'interrupt-1',
  value: { approved: true, metadata: ['keep'] },
  metadata: { actor: 'tom' } satisfies JsonObject,
};

void resumeCommand;
void resumeOptions;
