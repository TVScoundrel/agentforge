import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import express from 'express';
import {
  addRequestErrorHandler,
  configureRequestBoundaries,
  type ExpressAppOptions,
} from './request-boundaries.js';

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

async function request(options: ExpressAppOptions, requestOptions: RequestInit & { path: string }) {
  const app = express();
  configureRequestBoundaries(app, options);
  app.get('/health', (_req, res) => res.json({ status: 'healthy' }));
  app.post('/parse', (_req, res) => res.json({ ok: true }));
  addRequestErrorHandler(app);
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server did not expose a port');
  }

  return fetch(`http://127.0.0.1:${address.port}${requestOptions.path}`, {
    ...requestOptions,
    headers: {
      'content-type': 'application/json',
      ...(requestOptions.headers || {}),
    },
  });
}

describe('Express request boundaries', () => {
  it('allows the explicit local development origin and credentials', async () => {
    const response = await request(
      { corsOrigin: 'http://localhost:3000' },
      {
        path: '/health',
        headers: { origin: 'http://localhost:3000' },
      }
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it('rejects an origin outside the configured allowlist', async () => {
    const response = await request(
      { corsOrigin: 'https://app.example.com' },
      {
        path: '/health',
        headers: { origin: 'https://evil.example.com' },
      }
    );

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('does not advertise credentials for the development wildcard override', async () => {
    const response = await request(
      { corsOrigin: '*' },
      {
        path: '/health',
        headers: { origin: 'https://localhost.test' },
      }
    );

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('returns 413 for JSON bodies over the configured limit', async () => {
    const response = await request(
      { jsonLimit: '20b' },
      {
        method: 'POST',
        path: '/parse',
        body: JSON.stringify({ message: 'This request is too large' }),
      }
    );

    expect(response.status).toBe(413);
  });

  it('returns 413 for URL-encoded bodies over the configured limit', async () => {
    const response = await request(
      { urlEncodedLimit: '20b' },
      {
        method: 'POST',
        path: '/parse',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `message=${encodeURIComponent('This request is too large')}`,
      }
    );

    expect(response.status).toBe(413);
  });
});
