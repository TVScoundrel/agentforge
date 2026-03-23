import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AskHumanInput } from '../../src/agent/ask-human/types.js';

async function loadAskHumanToolModule() {
  return import('../../src/agent/ask-human/tool.js');
}

describe('askHuman Tool - interrupt boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock('@langchain/langgraph');
  });

  it('throws a clear error when LangGraph is not installed', async () => {
    vi.doMock('@langchain/langgraph', () => ({
      get interrupt() {
        throw new Error("Cannot find package '@langchain/langgraph'");
      },
    }));

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();

    await expect(
      tool.invoke({
        question: 'Should I continue?',
      })
    ).rejects.toThrow(
      'askHuman tool requires @langchain/langgraph to be installed. Install it with: npm install @langchain/langgraph'
    );
  });

  it('throws a compatibility error when interrupt is unavailable', async () => {
    vi.doMock('@langchain/langgraph', () => ({ interrupt: undefined }));

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();

    await expect(
      tool.invoke({
        question: 'Should I continue?',
      })
    ).rejects.toThrow(
      'interrupt function not found in @langchain/langgraph. Make sure you are using a compatible version of LangGraph.'
    );
  });

  it('returns the interrupt response when LangGraph resumes with a string', async () => {
    const interrupt = vi.fn().mockReturnValue('Approved by human');
    vi.doMock('@langchain/langgraph', () => ({ interrupt }));

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();
    const input: AskHumanInput = {
      question: 'Should I deploy?',
      priority: 'high',
      timeout: 0,
    };

    const result = await tool.invoke(input);

    expect(interrupt).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Should I deploy?',
        priority: 'high',
        status: 'pending',
      })
    );
    expect(result.response).toBe('Approved by human');
    expect(result.metadata.timedOut).toBe(false);
  });

  it('maps null interrupt resume values to an empty response string', async () => {
    const interrupt = vi.fn().mockReturnValue(null);
    vi.doMock('@langchain/langgraph', () => ({ interrupt }));

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();

    const result = await tool.invoke({
      question: 'Should I continue?',
    });

    expect(result.response).toBe('');
    expect(result.metadata.timedOut).toBe(false);
  });

  it('uses the default response when the timeout elapses', async () => {
    const interrupt = vi.fn().mockReturnValue('late human answer');
    vi.doMock('@langchain/langgraph', () => ({ interrupt }));
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(2_500);

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();

    const result = await tool.invoke({
      question: 'Approve deployment?',
      timeout: 1_000,
      defaultResponse: 'skip',
    });

    expect(result.response).toBe('skip');
    expect(result.metadata.duration).toBe(1_500);
    expect(result.metadata.timedOut).toBe(true);
  });

  it('honors an empty-string default response when the timeout elapses', async () => {
    const interrupt = vi.fn().mockReturnValue('late human answer');
    vi.doMock('@langchain/langgraph', () => ({ interrupt }));
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(5_000)
      .mockReturnValueOnce(7_000);

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();

    const result = await tool.invoke({
      question: 'Approve blank response?',
      timeout: 1_000,
      defaultResponse: '',
    });

    expect(result.response).toBe('');
    expect(result.metadata.timedOut).toBe(true);
  });

  it('rejects non-string interrupt resume values with a compatibility error', async () => {
    const interrupt = vi.fn().mockReturnValue({ answer: 'not-a-string' });
    vi.doMock('@langchain/langgraph', () => ({ interrupt }));

    const { createAskHumanTool } = await loadAskHumanToolModule();
    const tool = createAskHumanTool();

    await expect(
      tool.invoke({
        question: 'Should I continue?',
      })
    ).rejects.toThrow(
      'askHuman tool expected LangGraph interrupt() to resume with a string response. Received object.'
    );
  });
});
