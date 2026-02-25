#!/usr/bin/env node

/**
 * Convert workspace:* dependencies to concrete versions before publishing
 * This is necessary because pnpm publish doesn't always convert them automatically
 * See: https://github.com/pnpm/pnpm/issues/5094
 */

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , packageName] = process.argv;

if (!packageName) {
  console.error('Usage: node convert-workspace-deps.mjs <package-name>');
  console.error('Example: node convert-workspace-deps.mjs core');
  process.exit(1);
}

const packageDir = path.join(__dirname, `../packages/${packageName}`);
const packageJsonPath = path.join(packageDir, 'package.json');

(async () => {
  console.log(`Converting workspace dependencies for @agentforge/${packageName}...`);

  // Read the package.json
  const content = await readFile(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(content);

  // Get the root package.json to find workspace package versions
  const rootPkgPath = path.join(__dirname, '../package.json');
  const rootContent = await readFile(rootPkgPath, 'utf-8');
  const rootPkg = JSON.parse(rootContent);

  // Build a map of workspace package versions
  const workspaceVersions = {};
  const packagesDir = path.join(__dirname, '../packages');

  // Read all workspace package versions
  for (const wsPackageName of ['core', 'skills', 'patterns', 'tools', 'testing', 'cli']) {
    const wsPackagePath = path.join(packagesDir, wsPackageName, 'package.json');
    try {
      const wsContent = await readFile(wsPackagePath, 'utf-8');
      const wsPkg = JSON.parse(wsContent);
      workspaceVersions[wsPkg.name] = wsPkg.version;
    } catch (err) {
      // Package might not exist, skip
    }
  }

  // Convert workspace:* to concrete versions
  let modified = false;

  for (const depType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (pkg[depType]) {
      for (const [depName, depVersion] of Object.entries(pkg[depType])) {
        if (depVersion.startsWith('workspace:')) {
          const concreteVersion = workspaceVersions[depName];
          if (concreteVersion) {
            pkg[depType][depName] = concreteVersion;
            console.log(`  ${depName}: ${depVersion} → ${concreteVersion}`);
            modified = true;
          } else {
            console.warn(`  Warning: Could not find version for ${depName}`);
          }
        }
      }
    }
  }

  if (modified) {
    // Write back the modified package.json
    await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ Converted workspace:* to concrete versions in packages/${packageName}/package.json`);
  } else {
    console.log(`✅ No workspace dependencies to convert`);
  }
})()
  .catch((error) => {
    console.error('❌ Failed to convert workspace dependencies:', error);
    process.exit(1);
  });

