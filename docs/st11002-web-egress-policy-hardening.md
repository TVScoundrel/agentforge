# ST-11002: Web Tool Egress Policy Hardening

## Outcome

The default HTTP and scraper tools now validate every HTTP(S) destination before making a request. Localhost, metadata endpoints, link-local addresses, and private-network addresses are blocked by default, including when a hostname resolves to one of those address classes.

Redirects are handled explicitly rather than delegated to Axios. Each `Location` target is resolved and revalidated before the next request, so a public URL cannot redirect through a chain into a blocked destination. Redirects are limited to five hops by default.

## Configuration

`createHttpTools()` and `createScraperTools()` accept a `destinationPolicy` configuration:

```typescript
import { createHttpTools, createScraperTools } from '@agentforge/tools';

const [httpClient] = createHttpTools({
  destinationPolicy: {
    maxRedirects: 3,
  },
});

const [scraper] = createScraperTools({
  destinationPolicy: {
    allowPrivateNetwork: true,
  },
});
```

The opt-in flags are intentionally separate:

- `allowLocalhost` permits loopback destinations.
- `allowPrivateNetwork` permits RFC1918, IPv6 ULA, and carrier-grade private ranges.
- `allowLinkLocal` permits link-local destinations.
- `allowMetadata` permits known cloud metadata destinations, including `169.254.169.254`.
- `allowRedirects` can be set to `false`, and `maxRedirects` bounds allowed hops.

Applications should grant only the narrowest policy required. The opt-in exists for trusted operator-controlled or internal-network workflows; it is not a safe default for model-exposed tools.

## Compatibility

Existing factory signatures remain compatible. Existing HTTP and scraper tools still follow normal HTTP redirects and return their normal response/data shapes, but unsafe destinations now fail with `DestinationPolicyError` before the network request. The generic HTTP client reports the final URL after a validated redirect chain.

## Validation

Focused coverage in `packages/tools/tests/web/egress-policy.test.ts` covers IP literals, DNS-resolved private addresses, chained redirect bypasses, privileged opt-in, and factory wiring. No CI change is required because the policy uses the existing package and workspace TypeScript/Vitest/lint validation paths.
