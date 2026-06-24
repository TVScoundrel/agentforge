import { z } from 'zod';

export const activateSkillSchema = z.object({
  name: z.string().describe('The name of the skill to activate (e.g., "code-review")'),
});

export const readSkillResourceSchema = z.object({
  name: z.string().describe('The name of the skill that owns the resource'),
  path: z.string().describe('Relative path to the resource file within the skill directory (e.g., "references/GUIDE.md", "scripts/setup.sh")'),
});
