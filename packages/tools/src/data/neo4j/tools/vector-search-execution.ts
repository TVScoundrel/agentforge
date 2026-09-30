import type { Session } from 'neo4j-driver';

import { formatResults } from '../utils/result-formatter.js';

/** Execute the established node Vector Search query through an adapter-owned session. */
export async function executeVectorSearch(
  session: Session,
  indexName: string,
  limit: number | undefined,
  queryVector: number[]
) {
  const cypher = `
            CALL db.index.vector.queryNodes($indexName, $limit, $queryVector)
            YIELD node, score
            RETURN node, score
            ORDER BY score DESC
          `;

  const parameters = { indexName, limit, queryVector };
  const result = await session.run(cypher, parameters);
  const formattedResults = formatResults(result.records);

  return {
    results: formattedResults.map((record) => ({ node: record.node, score: record.score })),
    count: result.records.length,
  };
}
