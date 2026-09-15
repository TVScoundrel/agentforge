import { runNamedTestCommand } from '../named-test.js';

interface ToolTestOptions {
  watch?: boolean;
}

export async function toolTestCommand(name: string, options: ToolTestOptions): Promise<void> {
  return runNamedTestCommand(name, options, {
    noun: 'Tool',
    testDirectory: 'tools',
    creationHint: `agentforge tool:create ${name} --test`,
  });
}
