import { lookup as dnsLookup } from 'node:dns/promises';
import net from 'node:net';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

export type DestinationBlockReason =
  | 'unsupported-protocol'
  | 'localhost'
  | 'metadata'
  | 'private-network'
  | 'link-local'
  | 'redirect'
  | 'dns-resolution-failed';

export interface DestinationPolicy {
  allowLocalhost?: boolean;
  allowPrivateNetwork?: boolean;
  allowLinkLocal?: boolean;
  allowMetadata?: boolean;
  allowRedirects?: boolean;
  maxRedirects?: number;
}

const DEFAULT_MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const IPV4_MAPPED_NETWORK = '::ffff:0:0';

export const DEFAULT_DESTINATION_POLICY = Object.freeze({
  allowLocalhost: false,
  allowPrivateNetwork: false,
  allowLinkLocal: false,
  allowMetadata: false,
  allowRedirects: true,
  maxRedirects: DEFAULT_MAX_REDIRECTS,
});

export class DestinationPolicyError extends Error {
  readonly code = 'WEB_DESTINATION_BLOCKED';

  constructor(
    readonly url: string,
    readonly reason: DestinationBlockReason,
    message: string
  ) {
    super(message);
    this.name = 'DestinationPolicyError';
  }
}

function ipv4ToNumber(address: string): number | undefined {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return undefined;
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

function ipv4InCidr(address: string, network: string, prefix: number): boolean {
  const value = ipv4ToNumber(address);
  const networkValue = ipv4ToNumber(network);
  if (value === undefined || networkValue === undefined) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (networkValue & mask);
}

function expandIpv6(address: string): bigint | undefined {
  const normalized = address.toLowerCase().split('%')[0];
  let input = normalized;
  const ipv4Start = normalized.lastIndexOf(':') + 1;
  const ipv4 = normalized.slice(ipv4Start);

  if (net.isIP(ipv4) === 4) {
    const value = ipv4ToNumber(ipv4);
    if (value === undefined) return undefined;
    input = `${normalized.slice(0, ipv4Start)}${(value >>> 16).toString(16)}:${(value & 0xffff).toString(16)}`;
  }

  const halves = input.split('::');
  if (halves.length > 2) return undefined;
  const left = halves[0] ? halves[0].split(':').filter(Boolean) : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':').filter(Boolean) : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return undefined;

  const groups = [...left, ...Array.from({ length: missing }, () => '0'), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return undefined;
  return groups.reduce((value, group) => (value << 16n) | BigInt(parseInt(group, 16)), 0n);
}

function ipv6InCidr(address: bigint, network: bigint, prefix: number): boolean {
  return prefix === 0 || (address >> BigInt(128 - prefix)) === (network >> BigInt(128 - prefix));
}

function ipv6ToIpv4(address: bigint): string | undefined {
  const mappedNetwork = expandIpv6(IPV4_MAPPED_NETWORK);
  if (mappedNetwork === undefined || !ipv6InCidr(address, mappedNetwork, 96)) return undefined;
  const value = Number(address & 0xffffffffn) >>> 0;
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.');
}

function classifyIp(address: string): DestinationBlockReason | undefined {
  const normalized = address.replace(/^\[|\]$/g, '').toLowerCase();
  const version = net.isIP(normalized);

  if (version === 4) {
    if (normalized === '169.254.169.254') return 'metadata';
    if (ipv4InCidr(normalized, '127.0.0.0', 8)) return 'localhost';
    if (ipv4InCidr(normalized, '169.254.0.0', 16)) return 'link-local';
    if (ipv4InCidr(normalized, '10.0.0.0', 8) || ipv4InCidr(normalized, '172.16.0.0', 12) || ipv4InCidr(normalized, '192.168.0.0', 16) || ipv4InCidr(normalized, '100.64.0.0', 10)) return 'private-network';
    return undefined;
  }

  if (version !== 6) return undefined;
  const value = expandIpv6(normalized);
  if (value === undefined) return undefined;
  const mappedIpv4 = ipv6ToIpv4(value);
  if (mappedIpv4) return classifyIp(mappedIpv4);
  if (value === expandIpv6('fd00:ec2::254')) return 'metadata';
  if (value === expandIpv6('::1')) return 'localhost';
  if (ipv6InCidr(value, expandIpv6('fe80::')!, 10)) return 'link-local';
  if (ipv6InCidr(value, expandIpv6('fc00::')!, 7)) return 'private-network';
  return undefined;
}

function classifyHostname(hostname: string): DestinationBlockReason | undefined {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized === 'localhost.localdomain') return 'localhost';
  if (normalized === 'metadata' || normalized === 'metadata.google.internal' || normalized === 'instance-data') return 'metadata';
  return classifyIp(normalized);
}

function policyAllows(reason: DestinationBlockReason, policy: DestinationPolicy): boolean {
  if (reason === 'localhost') return policy.allowLocalhost === true;
  if (reason === 'metadata') return policy.allowMetadata === true;
  if (reason === 'private-network') return policy.allowPrivateNetwork === true;
  if (reason === 'link-local') return policy.allowLinkLocal === true;
  return false;
}

async function resolveDestinationAddresses(hostname: string): Promise<string[]> {
  try {
    const addresses = await dnsLookup(hostname, { all: true, verbatim: true });
    return addresses.map(({ address }) => address);
  } catch (error) {
    throw new DestinationPolicyError(hostname, 'dns-resolution-failed', `Destination policy could not resolve hostname "${hostname}" before making a request: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function blockDestination(url: string, reason: DestinationBlockReason): never {
  throw new DestinationPolicyError(url, reason, `Destination blocked by web egress policy (${reason}): ${url}`);
}

export async function assertDestinationAllowed(url: string, policy: DestinationPolicy = {}): Promise<void> {
  const effectivePolicy = { ...DEFAULT_DESTINATION_POLICY, ...policy };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    blockDestination(url, 'unsupported-protocol');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') blockDestination(url, 'unsupported-protocol');
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const directReason = classifyHostname(hostname);
  if (directReason && !policyAllows(directReason, effectivePolicy)) blockDestination(url, directReason);
  if (directReason) return;

  for (const address of await resolveDestinationAddresses(hostname)) {
    const reason = classifyIp(address);
    if (reason && !policyAllows(reason, effectivePolicy)) blockDestination(url, reason);
  }
}

function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

function responseLocation(response: AxiosResponse): string | undefined {
  const headers = response.headers as Record<string, string | undefined>;
  return headers.location ?? headers.Location;
}

export async function requestWithDestinationPolicy<T = unknown>(config: AxiosRequestConfig<T>, policy: DestinationPolicy = {}): Promise<AxiosResponse<T>> {
  if (!config.url) throw new Error('A request URL is required for destination policy enforcement');
  const effectivePolicy = { ...DEFAULT_DESTINATION_POLICY, ...policy };
  const maxRedirects = effectivePolicy.maxRedirects;
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0) throw new Error('maxRedirects must be a non-negative integer');

  let currentUrl = config.url;
  let currentConfig: AxiosRequestConfig<T> = {
    ...config,
    url: currentUrl,
    maxRedirects: 0,
    validateStatus: (status) => isRedirectStatus(status) || (config.validateStatus ? config.validateStatus(status) : status >= 200 && status < 300),
  };

  for (let redirectCount = 0; ; redirectCount += 1) {
    await assertDestinationAllowed(currentUrl, effectivePolicy);
    const response = await axios(currentConfig);
    if (!isRedirectStatus(response.status)) return response;
    if (effectivePolicy.allowRedirects === false) blockDestination(currentUrl, 'redirect');
    if (redirectCount >= maxRedirects) throw new DestinationPolicyError(currentUrl, 'redirect', `Maximum redirect count (${maxRedirects}) exceeded for ${currentUrl}`);

    const location = responseLocation(response);
    if (!location) throw new DestinationPolicyError(currentUrl, 'redirect', `Redirect response did not include a Location header: ${currentUrl}`);
    currentUrl = new URL(location, currentUrl).toString();
    const method = String(currentConfig.method ?? 'GET').toUpperCase();
    const nextMethod = response.status === 303 || ((response.status === 301 || response.status === 302) && method === 'POST') ? 'GET' : method;
    currentConfig = { ...currentConfig, url: currentUrl, method: nextMethod };
    if (nextMethod === 'GET' || nextMethod === 'HEAD') delete currentConfig.data;
  }
}
