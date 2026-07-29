# ST-11008: Express Request Boundaries

## Outcome

The Express integration example now uses an explicit `http://localhost:3000`
CORS origin by default instead of combining wildcard access with credentials.
`CORS_ORIGIN` accepts one exact origin; the `*` value remains available only as
a development override and disables credentials. The example still does not
provide authentication or authorization.

JSON and URL-encoded request bodies are limited to `100kb` by default. The
`JSON_BODY_LIMIT` and `URLENCODED_BODY_LIMIT` environment variables allow a
bounded, documented increase for applications with larger payload needs.
Oversized bodies return HTTP 413 rather than reaching a route handler.

## Test Strategy

Focused HTTP-level middleware tests cover the default allowed origin, rejected
origins, wildcard credential behavior, and JSON/form body-limit responses.

## Validation

- `pnpm --dir examples/integrations/express-api test --run`
- `pnpm lint`
- `pnpm typecheck`

The standalone example typecheck was also attempted, but remains blocked by
pre-existing incompatibilities in `src/routes/agent.ts` and `src/routes/chat.ts`
between their declared LangChain versions and the current AgentForge graph
typing (`ChatOpenAI` compatibility and `.compile()`); no changed middleware
file contributes to those errors.

No CI change is required: the story changes example configuration and adds
package-local tests, while the existing repository lint and typecheck commands
already cover the touched TypeScript sources.
