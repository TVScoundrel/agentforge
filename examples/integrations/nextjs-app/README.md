# Next.js Integration Example

A complete Next.js App Router integration with AgentForge, featuring API routes, streaming responses, and a chat UI.

## Features

- ⚡ **Next.js 14+**: App Router with Server Components
- 🎨 **Modern UI**: React components with Tailwind CSS
- 🌊 **Streaming**: Real-time streaming responses
- 💬 **Chat Interface**: Interactive chat UI
- 🔒 **API Routes**: Secure server-side agent execution
- 📱 **Responsive**: Mobile-friendly design
- ⚡ **Fast**: Optimized for performance

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

## Quick Start

```bash
# Create a new Next.js app
npx create-next-app@latest my-agent-app --typescript --tailwind --app

# Navigate to the project
cd my-agent-app

# Install AgentForge packages
pnpm add @agentforge/core @agentforge/patterns @agentforge/tools
pnpm add @langchain/openai langchain zod

# Add environment variables
echo "OPENAI_API_KEY=your-key-here" > .env.local

# Start development server
pnpm dev
```

## Project Structure

```
my-agent-app/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.ts          # Agent API endpoint
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── chat/
│   │   └── page.tsx              # Chat UI page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── ChatInterface.tsx         # Chat component
│   └── MessageList.tsx           # Message list component
├── lib/
│   └── agent.ts                  # Agent configuration
└── .env.local                    # Environment variables
```

## Implementation

### 1. Agent Configuration (`lib/agent.ts`)

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReActAgent } from '@agentforge/patterns';
import { calculator, currentDateTime } from '@agentforge/tools';

export function createAgent() {
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
  });

  return createReActAgent({
    model,
    tools: [calculator, currentDateTime],
    systemPrompt: 'You are a helpful AI assistant.',
  });
}
```

### 2. API Route (`app/api/agent/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const agent = createAgent();
    const compiledAgent = agent.compile();

    const result = await compiledAgent.invoke({
      messages: [{ role: 'user', content: message }],
    });

    const response = result.messages[result.messages.length - 1].content;

    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 3. Streaming API Route (`app/api/chat/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { createAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  const agent = createAgent();
  const compiledAgent = agent.compile();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamResult = await compiledAgent.stream({
          messages: [{ role: 'user', content: message }],
        });

        for await (const chunk of streamResult) {
          const lastMessage = chunk.messages[chunk.messages.length - 1];
          const data = JSON.stringify({ content: lastMessage.content });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error: any) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 4. Chat Interface Component (`components/ChatInterface.tsx`)

```typescript
'use client';

import { useState } from 'react';

export function ChatInterface() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

### 5. Chat Page (`app/chat/page.tsx`)

```typescript
import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold text-center p-4">
        AgentForge Chat
      </h1>
      <ChatInterface />
    </main>
  );
}
```

## Features

### Server-Side Agent Execution
- Agents run on the server, keeping API keys secure
- No client-side exposure of sensitive data

### Streaming Responses
- Real-time streaming for better UX
- Server-Sent Events (SSE) support

### Type Safety
- Full TypeScript support
- Type-safe API routes and components

### Performance
- Server Components for optimal performance
- Efficient agent initialization

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# OPENAI_API_KEY=your-key
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Best Practices

1. **Environment Variables**: Always use `.env.local` for secrets
2. **Error Handling**: Implement proper error boundaries
3. **Loading States**: Show loading indicators for better UX
4. **Rate Limiting**: Implement rate limiting for API routes
5. **Caching**: Use Next.js caching for repeated queries
6. **Validation**: Validate all inputs on the server

## Advanced Features

### Add Authentication

```typescript
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of the code
}
```

### Add Conversation History

```typescript
// Use a database or Redis to store conversation history
import { db } from '@/lib/db';

const history = await db.getConversationHistory(conversationId);
const result = await compiledAgent.invoke({
  messages: [...history, { role: 'user', content: message }],
});
```

### Add File Uploads

```typescript
import { fileReader } from '@agentforge/tools';

// Handle file uploads in API route
const formData = await request.formData();
const file = formData.get('file');
// Process file with agent
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [AgentForge Documentation](../../../docs-site/)
- [App Router Guide](https://nextjs.org/docs/app)

## License

MIT

