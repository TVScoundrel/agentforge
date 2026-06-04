import type {
  SkillEventHandler,
} from './types.js';
import { SkillRegistryEvent } from './types.js';

export type ScanError = { path: string; error: string };

export type RegistryEventHandlers = Map<SkillRegistryEvent, Set<SkillEventHandler>>;

export type RegistryEmit = (event: SkillRegistryEvent, data: unknown) => void;
