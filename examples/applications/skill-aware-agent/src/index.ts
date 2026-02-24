/**
 * Skill-Aware Agent Demo
 *
 * Demonstrates the AgentForge Agent Skills integration end-to-end:
 *
 * 1. Creates a SkillRegistry with two roots (workspace + community)
 * 2. Generates the <available_skills> prompt fragment
 * 3. Activates skills and loads resources via the activation tools
 * 4. Shows trust policy enforcement blocking untrusted script access
 *
 * Run (from repo root): pnpm tsx examples/applications/skill-aware-agent/src/index.ts
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SkillRegistry,
  SkillRegistryEvent,
  type SkillRegistryConfig,
} from '@agentforge/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuration ───────────────────────────────────────────────────────

const config: SkillRegistryConfig = {
  enabled: true,
  skillRoots: [
    // Workspace root — fully trusted (e.g. checked-in project skills)
    { path: resolve(__dirname, '../skills/workspace'), trust: 'workspace' },
    // Community root — untrusted (e.g. downloaded / shared skills)
    { path: resolve(__dirname, '../skills/community'), trust: 'untrusted' },
  ],
  maxDiscoveredSkills: 20,
  allowUntrustedScripts: false, // scripts from untrusted roots are blocked
};

// ─── Main ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🧠 Skill-Aware Agent Demo\n');

  // ── 1. Create registry ──────────────────────────────────────────────
  console.log('📦 Creating SkillRegistry …');
  const registry = new SkillRegistry(config);
  console.log(`   Discovered ${registry.size()} skill(s): ${registry.getNames().join(', ')}\n`);

  // ── 2. Event listeners ──────────────────────────────────────────────
  registry.on(SkillRegistryEvent.SKILL_ACTIVATED, (data) => {
    const d = data as { name: string };
    console.log(`   🟢 Event: skill activated → ${d.name}`);
  });
  registry.on(SkillRegistryEvent.SKILL_RESOURCE_LOADED, (data) => {
    const d = data as { name: string; resourcePath: string };
    console.log(`   🟢 Event: resource loaded → ${d.name}/${d.resourcePath}`);
  });
  registry.on(SkillRegistryEvent.TRUST_POLICY_DENIED, (data) => {
    const d = data as { name: string; resourcePath: string; message: string };
    console.log(`   🔴 Event: trust denied   → ${d.name}/${d.resourcePath} — ${d.message}`);
  });

  // ── 3. Generate <available_skills> prompt ───────────────────────────
  console.log('📝 Generated prompt fragment:\n');
  const prompt = registry.generatePrompt();
  console.log(prompt);
  console.log();

  // ── 4. Obtain activation tools ─────────────────────────────────────
  const [activateSkill, readResource] = registry.toActivationTools();
  console.log(`🔧 Activation tools ready: ${activateSkill.metadata.name}, ${readResource.metadata.name}\n`);

  // ── 5. Activate skills ─────────────────────────────────────────────
  console.log('── Activate workspace skill: code-review ──');
  const codeReviewBody = await activateSkill.invoke({ name: 'code-review' });
  console.log(`   Body (${codeReviewBody.length} chars):\n${indent(codeReviewBody)}\n`);

  console.log('── Activate workspace skill: test-generator ──');
  const testGenBody = await activateSkill.invoke({ name: 'test-generator' });
  console.log(`   Body (${testGenBody.length} chars):\n${indent(testGenBody)}\n`);

  console.log('── Activate community skill: community-tool ──');
  const communityBody = await activateSkill.invoke({ name: 'community-tool' });
  console.log(`   Body (${communityBody.length} chars):\n${indent(communityBody)}\n`);

  // ── 6. Load resources ──────────────────────────────────────────────
  console.log('── Read workspace resource (reference — allowed) ──');
  const styleGuide = await readResource.invoke({
    name: 'code-review',
    path: 'references/style-guide.md',
  });
  console.log(`   ${styleGuide.slice(0, 120).replace(/\n/g, ' ')}…\n`);

  console.log('── Read community resource (reference — allowed) ──');
  const communityRef = await readResource.invoke({
    name: 'community-tool',
    path: 'references/readme.md',
  });
  console.log(`   ${communityRef.slice(0, 120).replace(/\n/g, ' ')}…\n`);

  // ── 7. Trust policy enforcement ────────────────────────────────────
  console.log('── Read community script (BLOCKED by trust policy) ──');
  const scriptResult = await readResource.invoke({
    name: 'community-tool',
    path: 'scripts/install.sh',
  });
  console.log(`   Result: ${scriptResult}\n`);

  // ── 8. Summary ─────────────────────────────────────────────────────
  const scanErrors = registry.getScanErrors();
  console.log('📊 Summary:');
  console.log(`   Skills discovered : ${registry.size()}`);
  console.log(`   Scan errors       : ${scanErrors.length}`);
  console.log(`   Untrusted scripts : ${registry.getAllowUntrustedScripts() ? 'allowed' : 'blocked'}`);
  console.log('\n✅ Demo complete.');
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function indent(text: string, prefix = '   '): string {
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
