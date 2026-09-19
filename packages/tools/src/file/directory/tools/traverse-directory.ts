import { promises as fs } from 'fs';
import * as path from 'path';

export async function* traverseDirectory(
  directory: string,
  recursive: boolean,
): AsyncGenerator<{ name: string; fullPath: string; isFile: boolean; isDirectory: boolean }> {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const isDirectory = entry.isDirectory();

    yield {
      name: entry.name,
      fullPath,
      isFile: entry.isFile(),
      isDirectory,
    };

    if (recursive && isDirectory) {
      yield* traverseDirectory(fullPath, true);
    }
  }
}
