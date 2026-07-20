/**
 * Web Tools
 *
 * Tools for web interactions, scraping, and URL manipulation.
 */

export * from './http/index.js';
export * from './scraper/index.js';
export {
  assertDestinationAllowed,
  DEFAULT_DESTINATION_POLICY,
  DestinationPolicyError,
  requestWithDestinationPolicy,
} from './egress-policy.js';
export type { DestinationBlockReason, DestinationPolicy } from './egress-policy.js';
export * from './html-parser/index.js';
export * from './url-validator/index.js';
export * from './web-search/index.js';
export * from './slack/index.js';
export * from './confluence/index.js';
