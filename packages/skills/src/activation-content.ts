import matter from 'gray-matter';

/**
 * Extract the body content below YAML frontmatter from a SKILL.md file.
 *
 * Delegates to `gray-matter` for consistent frontmatter handling across
 * the codebase (matches `parseSkillContent()` in parser.ts).
 *
 * @param content - The full SKILL.md file content
 * @returns The body content below the frontmatter
 */
export function extractBody(content: string): string {
  return matter(content).content.trim();
}
