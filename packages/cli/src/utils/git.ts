import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export async function isGitInstalled(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function isGitRepository(cwd: string): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--git-dir'], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function initGitRepository(cwd: string): Promise<void> {
  await execa('git', ['init'], { cwd });
  
  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
.cache/
.temp/
.tmp/
`;

  await fs.writeFile(path.join(cwd, '.gitignore'), gitignore);
}

export async function createInitialCommit(cwd: string): Promise<void> {
  await execa('git', ['add', '.'], { cwd });
  await execa('git', ['commit', '-m', 'Initial commit from AgentForge CLI'], { cwd });
}

export async function getGitUserInfo(): Promise<{ name?: string; email?: string }> {
  try {
    const { stdout: name } = await execa('git', ['config', 'user.name']);
    const { stdout: email } = await execa('git', ['config', 'user.email']);
    return { name, email };
  } catch {
    return {};
  }
}

