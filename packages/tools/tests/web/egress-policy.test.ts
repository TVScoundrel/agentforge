import { lookup } from 'node:dns/promises';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertDestinationAllowed,
  requestWithDestinationPolicy,
  type DestinationPolicy,
} from '../../src/web/egress-policy.js';
import { createHttpTools } from '../../src/web/http/index.js';
import { createScraperTools } from '../../src/web/scraper/index.js';

vi.mock('axios');
vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

const mockedAxios = vi.mocked(axios);
const mockedLookup = vi.mocked(lookup);

beforeEach(() => {
  vi.clearAllMocks();
  mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
});

describe('web egress destination policy', () => {
  it.each([
    ['http://127.0.0.1/admin', 'localhost'],
    ['http://169.254.169.254/latest/meta-data', 'metadata'],
    ['http://10.0.0.8/internal', 'private-network'],
    ['http://172.16.0.4/internal', 'private-network'],
    ['http://192.168.1.20/internal', 'private-network'],
    ['http://169.254.10.20/internal', 'link-local'],
    ['http://[::1]/admin', 'localhost'],
    ['http://[::ffff:127.0.0.1]/admin', 'localhost'],
    ['http://[fd00::1]/internal', 'private-network'],
    ['http://[fe80::1]/internal', 'link-local'],
  ])('blocks %s as %s by default', async (url, reason) => {
    await expect(assertDestinationAllowed(url)).rejects.toMatchObject({ reason });
  });

  it('blocks hostnames that resolve to private addresses', async () => {
    mockedLookup.mockResolvedValue([{ address: '10.0.0.8', family: 4 }]);
    await expect(assertDestinationAllowed('https://public.example.test/resource')).rejects.toMatchObject({ reason: 'private-network' });
  });

  it('revalidates redirect destinations before following them', async () => {
    mockedAxios.mockResolvedValueOnce({
      status: 302,
      headers: { location: ['https://93.184.216.34/next'] },
      config: {},
      data: undefined,
      statusText: 'Found',
    }).mockResolvedValueOnce({
      status: 302,
      headers: { location: 'http://192.168.1.20/internal' },
      config: {},
      data: undefined,
      statusText: 'Found',
    });

    await expect(
      requestWithDestinationPolicy({
        method: 'GET',
        url: 'https://93.184.216.34/start',
        validateStatus: () => true,
      })
    ).rejects.toMatchObject({ reason: 'private-network' });
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });

  it('allows privileged internal-network opt-in across redirects', async () => {
    const policy: DestinationPolicy = {
      allowPrivateNetwork: true,
      allowLinkLocal: true,
      allowMetadata: true,
    };
    mockedAxios
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: 'http://192.168.1.20/internal' },
        config: {},
        data: undefined,
        statusText: 'Found',
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        config: {},
        data: { ok: true },
        statusText: 'OK',
      });

    const response = await requestWithDestinationPolicy(
      {
        method: 'GET',
        url: 'https://93.184.216.34/start',
        validateStatus: () => true,
      },
      policy
    );

    expect(response.data).toEqual({ ok: true });
    expect(mockedAxios).toHaveBeenCalledTimes(2);
  });

  it('strips sensitive headers before following a cross-origin redirect', async () => {
    mockedAxios
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: 'https://redirected.example.test/next' },
        config: {},
        data: undefined,
        statusText: 'Found',
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        config: {},
        data: { ok: true },
        statusText: 'OK',
      });

    await requestWithDestinationPolicy({
      method: 'GET',
      url: 'https://source.example.test/start',
      headers: {
        Authorization: 'Bearer secret',
        Cookie: 'session=secret',
        'Proxy-Authorization': 'Basic secret',
        'X-Request-Id': 'kept',
      },
      validateStatus: () => true,
    });

    const redirectedHeaders = mockedAxios.mock.calls[1][0].headers;
    expect(redirectedHeaders).toEqual({ 'X-Request-Id': 'kept' });
  });

  it('wraps invalid redirect locations in a destination policy error', async () => {
    mockedAxios.mockResolvedValueOnce({
      status: 302,
      headers: { location: 'https://[invalid' },
      config: {},
      data: undefined,
      statusText: 'Found',
    });

    await expect(requestWithDestinationPolicy({ url: 'https://source.example.test/start' })).rejects.toMatchObject({
      code: 'WEB_DESTINATION_BLOCKED',
      reason: 'redirect',
    });
  });

  it('allows explicit localhost opt-in for privileged operators', async () => {
    await expect(assertDestinationAllowed('http://127.0.0.1:8080/health', { allowLocalhost: true })).resolves.toBeUndefined();
  });

  it('wires the default policy through HTTP and scraper tool factories', async () => {
    const [, httpGet] = createHttpTools();
    const [scraper] = createScraperTools();

    await expect(httpGet.invoke({ url: 'http://10.0.0.8/internal' })).rejects.toMatchObject({ reason: 'private-network' });
    await expect(scraper.invoke({ url: 'http://127.0.0.1:8080/health' })).rejects.toMatchObject({ reason: 'localhost' });
    expect(mockedAxios).not.toHaveBeenCalled();
  });
});
