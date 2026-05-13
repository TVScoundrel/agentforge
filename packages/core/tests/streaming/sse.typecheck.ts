import { createSSEFormatter } from '../../src/streaming/sse.js';

const typedFormatter = createSSEFormatter<{ content: string }>({
  eventTypes: {
    token: (data) => ({
      event: 'token',
      data: data.content,
    }),
  },
});
void typedFormatter;

createSSEFormatter({
  eventTypes: {
    token: (data) => ({
      event: 'token',
      // @ts-expect-error default SSE formatter input should remain unknown-first
      data: data.content,
    }),
  },
});
