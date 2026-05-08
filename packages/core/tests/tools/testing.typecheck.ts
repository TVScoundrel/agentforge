import { createMockTool, createToolSimulator } from '../../src/tools/testing.js';

type SearchInput = { query: string };
type SearchOutput = { matches: string[] };
type StatusInput = { id: number };
type StatusOutput = { ok: boolean };

async function assertMockToolTyping() {
  const searchTool = createMockTool<'search', SearchInput, SearchOutput>({
    name: 'search',
    responses: [
      {
        input: { query: 'alpha' },
        output: { matches: ['a'] },
      },
      {
        input: (input) => input.query.startsWith('prefix:'),
        output: { matches: ['prefix'] },
      },
    ],
    defaultResponse: { matches: [] },
  });

  const output: SearchOutput = await searchTool.invoke({ query: 'alpha' });
  const invocations = searchTool.getInvocations();
  const invocationInput: SearchInput = invocations[0]!.input;
  const invocationOutput: SearchOutput | undefined = invocations[0]!.output;

  void output;
  void invocationInput;
  void invocationOutput;

  // @ts-expect-error - query must stay string-typed
  await searchTool.invoke({ query: 123 });
}

async function assertToolSimulatorTyping() {
  const searchTool = createMockTool<'search', SearchInput, SearchOutput>({
    name: 'search',
    defaultResponse: { matches: [] },
  });
  const statusTool = createMockTool<'status', StatusInput, StatusOutput>({
    name: 'status',
    defaultResponse: { ok: true },
  });
  const tools = [searchTool, statusTool] as const;

  const simulator = createToolSimulator({
    tools,
  });

  const searchResult: SearchOutput = await simulator.execute('search', { query: 'alpha' });
  const statusResult: StatusOutput = await simulator.execute('status', { id: 1 });
  const searchInvocations = simulator.getInvocations('search');
  const searchInvocationInput: SearchInput = searchInvocations[0]!.input;

  void searchResult;
  void statusResult;
  void searchInvocationInput;

  // @ts-expect-error - wrong input type for named tool
  await simulator.execute('status', { id: 'bad' });
}

void assertMockToolTyping();
void assertToolSimulatorTyping();
