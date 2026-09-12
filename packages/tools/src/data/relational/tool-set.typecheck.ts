import { ToolRegistry } from '@agentforge/core';

import type { RelationalToolSet } from './tool-set.js';

function registerRelationalTools(registry: ToolRegistry, relational: RelationalToolSet): void {
  registry.registerMany(relational);
}

void registerRelationalTools;
