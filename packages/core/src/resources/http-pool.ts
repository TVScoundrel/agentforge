/**
 * HTTP client pool implementation
 */

import { createConnectionPool, ConnectionPool, PoolConfig, HealthCheckConfig } from './pool.js';

export interface HttpConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  maxRedirects?: number;
  validateStatus?: (status: number) => boolean;
}

export interface HttpPoolConfig extends PoolConfig {
  maxSockets?: number;
  keepAlive?: boolean;
  keepAliveMsecs?: number;
}

export interface HttpClient {
  get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
  request<T = any>(config: RequestConfig): Promise<HttpResponse<T>>;
  close(): Promise<void>;
}

export interface RequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface HttpPoolOptions {
  config: HttpConfig;
  pool?: HttpPoolConfig;
  healthCheck?: HealthCheckConfig & {
    endpoint?: string;
    method?: string;
  };
  onConnect?: (client: HttpClient) => void;
  onDisconnect?: (client: HttpClient) => void;
}

/**
 * Mock HTTP client for demonstration
 * In production, replace with actual HTTP client (axios, fetch, etc.)
 */
class MockHttpClient implements HttpClient {
  private closed = false;

  constructor(private config: HttpConfig) {}

  async get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    if (this.closed) {
      throw new Error('Client is closed');
    }

    // Mock implementation
    return {
      data: {} as T,
      status: 200,
      statusText: 'OK',
      headers: {},
    };
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

export class HttpPool {
  private pool: ConnectionPool<HttpClient>;

  constructor(private options: HttpPoolOptions) {
    const healthCheckEndpoint = options.healthCheck?.endpoint || '/health';
    const healthCheckMethod = options.healthCheck?.method || 'GET';

    this.pool = createConnectionPool<HttpClient>({
      factory: async () => {
        const client = new MockHttpClient(options.config);
        options.onConnect?.(client);
        return client;
      },
      destroyer: async (client) => {
        await client.close();
        options.onDisconnect?.(client);
      },
      validator: async (client) => {
        try {
          const response = await client.request({
            url: healthCheckEndpoint,
            method: healthCheckMethod,
          });
          return response.status >= 200 && response.status < 300;
        } catch {
          return false;
        }
      },
      pool: options.pool,
      healthCheck: options.healthCheck,
    });
  }

  async acquire(): Promise<HttpClient> {
    return this.pool.acquire();
  }

  async release(client: HttpClient): Promise<void> {
    return this.pool.release(client);
  }

  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    const client = await this.acquire();
    try {
      return await client.request<T>(config);
    } finally {
      await this.release(client);
    }
  }

  async drain(): Promise<void> {
    return this.pool.drain();
  }

  async clear(): Promise<void> {
    return this.pool.clear();
  }

  getStats() {
    return this.pool.getStats();
  }
}

export function createHttpPool(options: HttpPoolOptions): HttpPool {
  return new HttpPool(options);
}

