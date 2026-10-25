# HTML extraction compatibility baseline

Issue: [#315](https://github.com/TVScoundrel/agentforge/issues/315)
Parent specification: [#314](https://github.com/TVScoundrel/agentforge/issues/314)

These tests characterize existing behavior before extraction consolidation. All runtime
assertions use public Tool `invoke` methods. Scraper responses come from the mocked
existing destination-policy request module; the separate destination-policy suite
continues to exercise real policy behavior with mocked HTTP/DNS.

- `html-extraction.test.ts`: descriptive resource records, URL resolution, element
  extraction, requested attributes, parser normalization, omitted flags and errors.
- `scraper-extraction.test.ts`: resource projection/filtering, selected and aggregate
  content, metadata, request wiring and errors.
- `../compatibility/html-extraction.types.ts`: a consumer compiled against generated
  declarations by `verify:package-surface`. Checks exact link/image results, the
  scraper result interface, permissive parser results and scraper selected values,
  factories, default instances, groups, configurations, schemas and optional inputs.
- `fixtures/extraction.ts`: deterministic HTML shared by the runtime suites.

## Observed inconsistencies retained for separate follow-up

These are compatibility facts, not behavior corrections proposed by this ticket.

1. Direct `invoke` does not apply schema defaults: omitted extraction flags produce
   no text/HTML fields, even though schemas advertise text extraction by default.
   Omitted scraper timeout uses its factory default; zero also uses that default.
2. Dedicated resource extractors keep empty href/src values and optional keys with
   `undefined` values. Scraper drops empty values and returns URL strings. Neither
   path deduplicates. HTML `<base>` elements do not control resolution.
3. Scraper resolves resources against the requested URL but reports
   `response.config.url` with a nullish fallback. An empty response URL is retained.
4. Scraper combines selected text without introducing separators and returns the
   first match's inner HTML, while the parser returns one record per match.
   Scraper selected records are populated even with extraction flags disabled.
   Links, images and metadata remain document-wide when a selector is supplied.
5. Selector strings that look like HTML are accepted by the underlying parser.
   A comment selector yields `html: null` in per-element records; scraper's
   aggregate HTML is instead `''`. Empty elements have `html: ''`; absent
   matches produce no per-element records.
6. Metadata title text is not trimmed. Fallback reads the first matching meta tag,
   but later document-order traversal can overwrite the same key. `name` wins
   over `property` on a single tag unless empty; empty/missing content is ignored.
   The optional top-level scraper `title` remains absent; title is in metadata.
7. Parser result elements and scraper selected values are permissive published
   types. Tightening these types is separate work, even if runtime records appear
   more precise.

No production extraction behavior changes are included. Any correction to these
contracts needs its own decision and tests rather than being folded into #314.

## Validation

From the repository root:

```sh
pnpm exec vitest run packages/tools/tests/web/html-extraction.test.ts packages/tools/tests/web/scraper-extraction.test.ts packages/tools/tests/web/egress-policy.test.ts
pnpm --filter @agentforge/tools typecheck
pnpm --filter @agentforge/tools lint
pnpm --filter @agentforge/tools build
pnpm --filter @agentforge/tools verify:package-surface
pnpm test
```
