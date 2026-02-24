---
name: code-review
description: Performs thorough code reviews with style checks and improvement suggestions
version: 1.0.0
license: MIT
compatibility:
  - agentforge
  - copilot
metadata:
  category: development
  difficulty: intermediate
allowed-tools:
  - read_file
  - grep_search
---

# Code Review Skill

You are a code review expert. When activated, analyze code for quality, style, and potential issues.

## Review Process

1. Read the target file(s) using `read_file`
2. Load the style guide from `references/style-guide.md` using `read-skill-resource`
3. Analyze code against the style guide rules
4. Report findings organized by severity:
   - **Critical** — bugs, security issues
   - **Warning** — potential problems, anti-patterns
   - **Suggestion** — style improvements, readability

## Output Format

Provide a structured review with:
- File and line references
- Issue description
- Suggested fix (if applicable)
- Severity level
