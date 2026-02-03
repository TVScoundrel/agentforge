# Feature Planning Guide for AI Assistants

**Purpose:** This guide explains how to create comprehensive planning documents for new features, migrations, or significant changes to the AgentForge codebase.

**When to create a planning document:**
- Adding new tools or tool categories
- Migrating code between packages or repositories
- Implementing complex features that span multiple files/packages
- Making architectural changes
- Any work that requires multiple PRs or phases

---

## Planning Document Structure

Every planning document should be saved in `dev-docs/` and follow this structure:

### 1. Header Section

```markdown
# [Feature Name] Plan

**Goal:** [One sentence describing what you're trying to achieve]

**Status:** [Current phase and status, e.g., "Phase 3 Complete - Tests Added"]
```

**Guidelines:**
- Title should be clear and descriptive
- Goal should be concise (1-2 sentences max)
- Status should be updated as work progresses

### 2. Overview Section

Include three subsections:

#### Current State
- Where is the code now?
- What's the current implementation?
- What are the limitations or problems?
- What dependencies exist?

#### Target State
- Where should the code be?
- What's the desired implementation?
- What improvements will be made?
- What new capabilities will be added?

#### Impact
- What metrics will change? (tool count, test count, etc.)
- What dependencies will be added/removed?
- What breaking changes might occur?
- What packages/files will be affected?

**Example:**
```markdown
### Current State
- **Location:** `playground/src/tools/confluence.ts`
- **Tools Count:** 7 tools (4 read, 3 write)
- **Dependencies:** `axios` for HTTP requests
- **Test Coverage:** Extensive test files in playground

### Target State
- **Location:** `packages/tools/src/web/confluence.ts`
- **Configuration:** Support both env vars and programmatic config
- **Factory Function:** `createConfluenceTools(config?)`
- **Tests:** Comprehensive tests with mocked axios

### Impact
- **Tool Count:** 74 → 81 tools (+7)
- **Web Tools:** 15 → 22 tools (+7)
- **New Dependency:** None (axios already in tools package)
```

### 3. Detailed Scope Section

List exactly what will be implemented/migrated/changed.

**For tools:**
```markdown
## Tools to Migrate

### Read Tools (4)
1. ✅ `search-confluence` - Search using CQL
2. ✅ `get-confluence-page` - Get full page content by ID
3. [ ] `list-confluence-spaces` - List all available spaces
4. [ ] `get-space-pages` - Get all pages from a specific space
```

**For features:**
```markdown
## Features to Implement

### Core Features
1. [ ] User authentication with JWT
2. [ ] Session management
3. [ ] Password reset flow

### Optional Features
1. [ ] OAuth integration
2. [ ] Two-factor authentication
```

**Guidelines:**
- Use checkboxes to track progress
- Group related items together
- Be specific about what each item does
- Update checkboxes as work completes

### 4. Migration Phases / Implementation Phases

Break the work into logical phases. Each phase should:
- Have a clear goal
- Be independently testable
- Result in a PR (or commit for small changes)
- Build on previous phases

**Structure for each phase:**

```markdown
### Phase X: [Phase Name] [Status Emoji]
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [ ] Update planning document
- [ ] **Create PR:** `branch-name` and wait for review
- **PR #X:** [Status - Open/Merged/Closed]
- **Status:** [Not Started/In Progress/Complete]
```

**Phase naming conventions:**
- Phase 1: Planning
- Phase 2: Implementation / Core Implementation
- Phase 3: Configuration / Additional Features
- Phase 4: Refactoring / Optimization
- Phase 5: Tests / Testing
- Phase 6: Package Updates / Exports
- Phase 7: Integration / Playground Updates
- Phase 8: Build & Test / Verification
- Phase 9: Documentation & Changelog

**Status emojis:**
- ✅ Complete
- 🏗️ In Progress
- ⏸️ Blocked/Waiting
- ❌ Failed/Cancelled

**Guidelines:**
- Always include "Update planning document" as a task
- Always create a PR for each phase (except verification phases)
- Update status as work progresses
- Add detailed results/notes after completion

**Example:**
```markdown
### Phase 5: Tests ✅
- [x] Create `packages/tools/tests/web/confluence.test.ts`
- [x] Mock axios for all HTTP requests using vi.hoisted() pattern
- [x] Test all 7 tools (read + write) - 32 tests total
- [x] Test configuration options (env vars + programmatic)
- [x] Test error handling (missing config, API errors, network errors)
- [x] Verify all tests pass (975/975 tests passing)
- [x] Update planning document
- [x] **Create PR:** `test/confluence-tools-tests` and wait for review
- **PR #9:** Merged ✅
- **Status:** Complete

**Results:**
- ✅ All 32 tests passing
- ✅ Test coverage: 7 metadata + 25 functional tests
- ✅ Mocking pattern follows Slack tools approach
```

### 5. Technical Details Section

Document the technical implementation details:

#### Configuration
Show how the feature will be configured:
```markdown
### Configuration

**Environment Variables:**
\`\`\`bash
FEATURE_API_KEY=your_key
FEATURE_ENDPOINT=https://api.example.com
\`\`\`

**Programmatic Configuration:**
\`\`\`typescript
import { createFeatureTools } from '@agentforge/tools';

const tools = createFeatureTools({
  apiKey: 'your_key',
  endpoint: 'https://api.example.com'
});
\`\`\`
```

#### Dependencies
List all dependencies:
```markdown
### Dependencies
- `axios` - Already in tools package dependencies
- `zod` - Already in tools package
- `new-package@^1.0.0` - NEW: Needs to be added
```

#### Architecture
Explain key architectural decisions:
```markdown
### Architecture
- Uses factory pattern for configuration
- Implements closure-based auth handling
- Follows Slack tools pattern for consistency
- Stores tools in `packages/tools/src/web/feature/`
```

### 6. Testing Strategy Section

Document how the feature will be tested:

```markdown
## Testing Strategy

### Unit Tests (Mocked)
- Mock HTTP client for all requests
- Test successful responses
- Test error responses (401, 403, 404, 500)
- Test network errors
- Test configuration validation
- Test edge cases

### Integration Tests
- Test against real API (when credentials available)
- Verify end-to-end workflows
- Test in playground environment

### Expected Test Count
- **Feature A:** ~5 tests
- **Feature B:** ~8 tests
- **Configuration:** ~4 tests
- **Total:** ~17-20 new tests
```

### 7. Migration/Implementation Checklist

Provide a high-level checklist:

```markdown
## Implementation Checklist

### Pre-Implementation
- [ ] Review existing code
- [ ] Create planning document
- [ ] Verify dependencies
- [ ] Check for conflicts

### Implementation
- [ ] Phase 1: Planning ✅
- [ ] Phase 2: Core implementation
- [ ] Phase 3: Configuration
- [ ] Phase 4: Tests
- [ ] Phase 5: Documentation

### Post-Implementation
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Ready for release
```

### 8. Success Criteria Section

Define what "done" looks like:

```markdown
## Success Criteria

- ✅ All features implemented and working
- ✅ Configuration via env vars AND programmatic config
- ✅ All tests passing (~20 new tests)
- ✅ Documentation complete
- ✅ Changelog updated
- ✅ No breaking changes (or documented if unavoidable)
- ✅ Metrics updated (tool count, test count, etc.)
```

**Guidelines:**
- Use checkboxes to track completion
- Be specific and measurable
- Include both functional and non-functional criteria
- Update as criteria are met

### 9. Notes Section

Include additional context:

```markdown
## Notes

### Differences from Similar Features
- **More complex:** Handles both sync and async operations
- **Different auth:** Uses OAuth instead of API keys
- **New pattern:** First feature to use streaming responses

### Similarities to Existing Features
- Same configuration pattern as Slack tools
- Same logging pattern
- Same error handling approach

### Follow-up Tasks
After implementation is complete:
- Consider adding feature X
- Consider optimizing performance
- Add to next release (X.Y.Z)
```

### 10. Timeline Estimate Section

Provide time estimates:

```markdown
## Timeline Estimate

- **Phase 1 (Planning):** ✅ Complete
- **Phase 2 (Implementation):** ~45 minutes
- **Phase 3 (Configuration):** ~30 minutes
- **Phase 4 (Tests):** ~60 minutes
- **Phase 5 (Documentation):** ~30 minutes

**Total Estimated Time:** ~2.5-3 hours
```

### 11. Pull Requests Section

Track all PRs:

```markdown
## Pull Requests

### PR Summary
- [x] **PR #6:** `feat/feature-implementation` - Phase 2 ✅ Merged
- [x] **PR #7:** `feat/feature-configuration` - Phase 3 ✅ Merged
- [ ] **PR #8:** `test/feature-tests` - Phase 4 ⏳ Awaiting review
- [ ] **PR #9:** `docs/feature-documentation` - Phase 5 📝 Draft

**Total PRs:** 4

### PR Workflow
For each PR:
1. Create feature branch from main
2. Make changes for that phase
3. Commit with conventional commit message
4. Push branch to GitHub
5. Create PR with detailed description
6. Wait for review
7. Merge to main
8. Update planning document with ✅
```

### 12. Footer

Always include:

```markdown
---

**Last Updated:** YYYY-MM-DD
**Status:** [Current phase and next steps]
```

---

## Best Practices

### DO ✅

1. **Create the planning document FIRST** before writing any code
   - Helps clarify scope and approach
   - Provides a roadmap for implementation
   - Makes it easier to track progress

2. **Break work into small, logical phases**
   - Each phase should be independently testable
   - Each phase should result in a PR
   - Phases should build on each other

3. **Update the planning document frequently**
   - After completing each task
   - After merging each PR
   - When scope changes or new information emerges

4. **Be specific and detailed**
   - List exact file paths
   - Include code examples
   - Document configuration options
   - Specify test counts

5. **Track all PRs in the document**
   - Include PR numbers
   - Link to PR URLs
   - Note merge status
   - Document any issues or blockers

6. **Include success criteria**
   - Make them measurable
   - Update checkboxes as criteria are met
   - Ensure all criteria are met before closing

7. **Document technical decisions**
   - Explain why you chose a particular approach
   - Note alternatives considered
   - Document any trade-offs

8. **Estimate timelines**
   - Helps set expectations
   - Useful for planning releases
   - Can be updated as work progresses

### DON'T ❌

1. **Don't skip the planning phase**
   - Jumping straight to code leads to mistakes
   - Planning saves time in the long run

2. **Don't make phases too large**
   - Large phases are hard to review
   - Harder to track progress
   - More likely to introduce bugs

3. **Don't forget to update the document**
   - Stale planning documents are worse than no document
   - Update after every significant change

4. **Don't be vague**
   - "Add some tests" → "Add 32 tests covering all 7 tools"
   - "Update docs" → "Update README.md tool count from 74 to 81"

5. **Don't skip the verification phase**
   - Always include a build & test phase
   - Verify everything works before documentation

6. **Don't forget the changelog**
   - Always include a documentation phase
   - Update changelog before release

---

## Example: Simple Feature Planning Document

Here's a minimal example for a smaller feature:

```markdown
# Add Rate Limiting to API Tools

**Goal:** Add configurable rate limiting to all API-based tools to prevent hitting API limits.

**Status:** Phase 2 Complete - Implementation Done

---

## Overview

### Current State
- No rate limiting on API tools
- Users can hit API limits and get errors
- No way to configure request throttling

### Target State
- Configurable rate limiting per tool
- Global rate limiter for all API tools
- Graceful handling of rate limit errors

### Impact
- No breaking changes
- New optional configuration
- Better error handling

---

## Implementation Phases

### Phase 1: Planning ✅
- [x] Review existing API tools
- [x] Research rate limiting libraries
- [x] Create planning document
- **Status:** Complete

### Phase 2: Implementation ✅
- [x] Add `bottleneck` dependency
- [x] Create `RateLimiter` utility class
- [x] Update all API tools to use rate limiter
- [x] Add configuration options
- [x] **Create PR:** `feat/rate-limiting`
- **PR #15:** Merged ✅
- **Status:** Complete

### Phase 3: Tests 🏗️
- [x] Test rate limiter utility
- [x] Test configuration options
- [ ] Test with real API calls
- [ ] **Create PR:** `test/rate-limiting`
- **Status:** In Progress

### Phase 4: Documentation
- [ ] Update tools.md with rate limiting info
- [ ] Add examples to README
- [ ] Update changelog
- [ ] **Create PR:** `docs/rate-limiting`

---

## Technical Details

### Configuration
\`\`\`typescript
const tools = createSlackTools({
  token: 'xoxb-...',
  rateLimit: {
    maxConcurrent: 5,
    minTime: 200 // ms between requests
  }
});
\`\`\`

### Dependencies
- `bottleneck@^2.19.5` - NEW: Rate limiting library

---

## Success Criteria

- ✅ Rate limiting implemented for all API tools
- ✅ Configurable per tool and globally
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No breaking changes

---

**Last Updated:** 2026-02-03
**Status:** Phase 3 In Progress - Tests being added
```

---

## Tips for AI Assistants

### When Creating a Planning Document

1. **Ask clarifying questions** if the scope is unclear
   - "Should this support both env vars and programmatic config?"
   - "Do you want this in a separate package or existing package?"
   - "Should this be a breaking change or backward compatible?"

2. **Research similar features** in the codebase
   - Look for similar tools or patterns
   - Follow existing conventions
   - Reuse existing utilities

3. **Estimate conservatively**
   - It's better to overestimate time than underestimate
   - Account for testing and documentation time
   - Include buffer for unexpected issues

4. **Use the task management tools**
   - Create tasks for each phase
   - Update task status as you progress
   - Helps track overall progress

### During Implementation

1. **Update the planning document after each phase**
   - Mark tasks as complete
   - Add PR numbers and links
   - Document any issues or changes

2. **Reference the planning document in PRs**
   - Link to the planning document
   - Mention which phase the PR implements
   - Helps reviewers understand context

3. **Adjust the plan as needed**
   - If scope changes, update the document
   - If new phases are needed, add them
   - If phases can be combined, merge them

### After Completion

1. **Verify all success criteria are met**
   - Check off all items
   - Ensure nothing was missed

2. **Update the final status**
   - Mark all phases as complete
   - Update the header status
   - Add final completion date

3. **Keep the document for reference**
   - Don't delete planning documents
   - They're useful for future similar work
   - They document decisions and rationale

---

## Template

Use this template to start a new planning document:

```markdown
# [Feature Name] Plan

**Goal:** [One sentence describing the goal]

**Status:** Phase 1 - Planning

---

## Overview

### Current State
-

### Target State
-

### Impact
-

---

## [Scope Section - Tools/Features/Changes]

### [Category 1]
1. [ ] Item 1
2. [ ] Item 2

---

## Implementation Phases

### Phase 1: Planning
- [ ] Review existing code
- [ ] Create planning document
- **Status:** In Progress

### Phase 2: Implementation
- [ ] Task 1
- [ ] Task 2
- [ ] **Create PR:** `branch-name`
- **Status:** Not Started

---

## Technical Details

### Configuration
\`\`\`typescript
// Example configuration
\`\`\`

### Dependencies
-

---

## Testing Strategy

### Unit Tests
-

### Expected Test Count
- **Total:** ~X tests

---

## Success Criteria

- [ ] Feature implemented
- [ ] Tests passing
- [ ] Documentation updated

---

**Last Updated:** YYYY-MM-DD
**Status:** Phase 1 - Planning
```

---

## Reference Examples

For real-world examples of excellent planning documents, see:
- `dev-docs/CONFLUENCE_TOOLS_MIGRATION_PLAN.md` - Complex multi-phase migration
- `dev-docs/SLACK_TOOLS_MIGRATION_PLAN.md` - Similar tool migration (if exists)

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-03
**Maintained By:** AI Assistants working on AgentForge

