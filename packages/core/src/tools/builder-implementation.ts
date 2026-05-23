export type ToolInvoke<TOutput> = (this: unknown, input: unknown) => Promise<TOutput>;
export type SafeToolResult<T> = { success: boolean; data?: T; error?: string };

export function wrapInvoke<TInput, TOutput>(invoke: (input: TInput) => Promise<TOutput>): ToolInvoke<TOutput> {
  return async function (this: unknown, input) {
    return invoke.call(this, input as TInput);
  };
}

export function wrapSafeInvoke<TInput, TOutput>(
  invoke: (input: TInput) => Promise<TOutput>,
): ToolInvoke<SafeToolResult<TOutput>> {
  return wrapInvoke(async function (this: unknown, input: TInput) {
    try {
      const data = await invoke.call(this, input);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
