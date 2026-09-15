import { describe, it, expect, vi } from 'vitest';
import { toolTestCommand } from '../../../src/commands/tool/test.js';
import { runNamedTestCommand } from '../../../src/commands/named-test.js';

vi.mock('../../../src/commands/named-test.js');

describe('tool:test command', () => {
  it('supplies the Tool conventions to the named-test protocol', async () => {
    const options = { watch: true };

    await toolTestCommand('myTool', options);

    expect(runNamedTestCommand).toHaveBeenCalledWith('myTool', options, {
      noun: 'Tool',
      testDirectory: 'tools',
      creationHint: 'agentforge tool:create myTool --test',
    });
  });
});
