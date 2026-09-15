import { runNamedTestCommand } from '../named-test.js';

interface AgentTestOptions {
  watch?: boolean;
}

export async function agentTestCommand(name: string, options: AgentTestOptions): Promise<void> {
  return runNamedTestCommand(name, options, {
    noun: 'Agent',
    testDirectory: 'agents',
    creationHint: `agentforge agent:create ${name} --test`,
  });
}
