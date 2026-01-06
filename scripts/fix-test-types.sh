#!/bin/bash

# Fix TypeScript errors in test files by adding NodeFunction type annotations

# Files to fix
FILES=(
  "packages/core/src/langgraph/middleware/__tests__/concurrency.test.ts"
  "packages/core/src/langgraph/middleware/__tests__/rate-limiting.test.ts"
  "packages/core/src/langgraph/middleware/__tests__/validation.test.ts"
)

for file in "${FILES[@]}"; do
  echo "Fixing $file..."
  
  # Add NodeFunction import if not present
  if ! grep -q "import type { NodeFunction }" "$file"; then
    # Find the line with the last import
    last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    
    # Insert the import after the last import
    sed -i.bak "${last_import_line}a\\
import type { NodeFunction } from '../types.js';
" "$file"
  fi
  
  # Replace all occurrences of "const node = vi.fn" with "const node: NodeFunction<TestState> = vi.fn"
  sed -i.bak 's/const node = vi\.fn/const node: NodeFunction<TestState> = vi.fn/g' "$file"
  
  # Replace all occurrences of "const node1 = vi.fn" with "const node1: NodeFunction<TestState> = vi.fn"
  sed -i.bak 's/const node1 = vi\.fn/const node1: NodeFunction<TestState> = vi.fn/g' "$file"
  
  # Replace all occurrences of "const node2 = vi.fn" with "const node2: NodeFunction<TestState> = vi.fn"
  sed -i.bak 's/const node2 = vi\.fn/const node2: NodeFunction<TestState> = vi.fn/g' "$file"
  
  # Clean up backup files
  rm -f "${file}.bak"
  
  echo "Fixed $file"
done

echo "Done!"

