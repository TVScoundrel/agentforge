import type {
  Skill,
  SkillEventHandler,
  SkillPromptOptions,
  SkillRegistryConfig,
  TrustLevel,
} from './types.js';
import { SkillRegistryEvent } from './types.js';
import { createSkillActivationTools } from './activation.js';
import { discoverSkills } from './registry-discovery.js';
import {
  addRegistryEventHandler,
  emitRegistryEvent,
  removeRegistryEventHandler,
} from './registry-events.js';
import type { RegistryEventHandlers } from './registry-internal.js';
import { generateSkillPrompt } from './registry-prompt.js';
import {
  getAllSkills,
  getAllowedTools,
  getScanErrors,
  getSkill,
  getSkillCount,
  getSkillNames,
  hasSkill,
} from './registry-query-api.js';

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private eventHandlers: RegistryEventHandlers = new Map();
  private readonly config: SkillRegistryConfig;
  private scanErrors: Array<{ path: string; error: string }> = [];
  private rootTrustMap: Map<string, TrustLevel> = new Map();

  constructor(config: SkillRegistryConfig) {
    this.config = config;
    this.discover();
  }

  discover(): void {
    this.scanErrors = discoverSkills(this.config, this.skills, this.rootTrustMap, (event, data) => {
      this.emit(event, data);
    });
  }

  get(name: string): Skill | undefined {
    return getSkill(this.skills, name);
  }

  getAll(): Skill[] {
    return getAllSkills(this.skills);
  }

  has(name: string): boolean {
    return hasSkill(this.skills, name);
  }

  size(): number {
    return getSkillCount(this.skills);
  }

  getNames(): string[] {
    return getSkillNames(this.skills);
  }

  getScanErrors(): ReadonlyArray<{ path: string; error: string }> {
    return getScanErrors(this.scanErrors);
  }

  getAllowUntrustedScripts(): boolean {
    return this.config.allowUntrustedScripts ?? false;
  }

  getAllowedTools(name: string): string[] | undefined {
    return getAllowedTools(this.skills, name);
  }

  generatePrompt(options?: SkillPromptOptions): string {
    return generateSkillPrompt(this.config, this.getAll(), this.size(), options);
  }

  on(event: SkillRegistryEvent, handler: SkillEventHandler): void {
    addRegistryEventHandler(this.eventHandlers, event, handler);
  }

  off(event: SkillRegistryEvent, handler: SkillEventHandler): void {
    removeRegistryEventHandler(this.eventHandlers, event, handler);
  }

  emitEvent(event: SkillRegistryEvent, data: unknown): void {
    this.emit(event, data);
  }

  toActivationTools(): ReturnType<typeof createSkillActivationTools> {
    return createSkillActivationTools(this);
  }

  private emit(event: SkillRegistryEvent, data: unknown): void {
    emitRegistryEvent(this.eventHandlers, event, data);
  }
}
