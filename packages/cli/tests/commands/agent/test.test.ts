import { describe, it, expect, vi } from 'vitest';
import { agentTestCommand } from '../../../src/commands/agent/test.js';
import { runNamedTestCommand } from '../../../src/commands/named-test.js';

vi.mock('../../../src/commands/named-test.js');

describe('agent:test command', () => {
  it('supplies the Agent conventions to the named-test protocol', async () => {
    const options = { watch: true };

    await agentTestCommand('myAgent', options);

    expect(runNamedTestCommand).toHaveBeenCalledWith('myAgent', options, {
      noun: 'Agent',
      testDirectory: 'agents',
      creationHint: 'agentforge agent:create myAgent --test',
    });
  });
});
