# Agents — Orchestration Reference

This project uses Claude Code subagents for specialized tasks. Each agent has scoped tools and a focused responsibility. The orchestrator (you, the main conversation) decides which agent to delegate to.

## When to delegate

Delegate when the task is:
- Well-scoped (clear input, clear done state)
- Specialized (one kind of work, like testing or security review)
- Repetitive (same pattern used often)

Do NOT delegate for:
- Exploratory conversation
- Ambiguous "figure out what to do" tasks
- Simple one-file edits
- Anything requiring business context the user just gave

## Available subagents

### `playwright-tester`
**Use when**: writing or updating E2E tests, reproducing UI bugs, validating user flows
**Model**: Sonnet
**Tools**: Read, Write, Edit, Bash, Playwright MCP
**Good prompts**:
- "Write a Playwright test for the lead submission flow"
- "Reproduce the bug where the admin login redirect loops"
- "Verify all public pages load without console errors"

### `security-reviewer`
**Use when**: reviewing PRs for security issues, auditing RLS policies, checking for exposed secrets
**Model**: Opus
**Tools**: Read, Grep, Glob, Bash (read-only)
**Good prompts**:
- "Review the lead submission endpoint for vulnerabilities"
- "Audit all RLS policies — are there any that anon can exploit?"
- "Scan this PR diff for leaked secrets or unsafe patterns"

### `pr-reviewer`
**Use when**: reviewing a PR before merge for code quality, test coverage, convention adherence
**Model**: Sonnet
**Tools**: Read, Grep, Glob, Bash (read-only), GitHub MCP
**Good prompts**:
- "Review PR #12 and leave inline comments"
- "Check this branch for typecheck and lint issues before I merge"

### `schema-agent`
**Use when**: designing or modifying database schema, writing migrations, planning RLS policies
**Model**: Opus
**Tools**: Read, Write, Edit, Bash (for supabase CLI)
**Good prompts**:
- "Design the schema for a new bookings table"
- "Write a migration to add a status column to leads"
- "Review my RLS policies for the gallery_items table"

### `seo-agent`
**Use when**: writing metadata, JSON-LD schema, city landing pages, sitemap configuration
**Model**: Sonnet
**Tools**: Read, Write, Edit, Web Search
**Good prompts**:
- "Generate LocalBusiness schema for every public page"
- "Write metadata for the /services/driveway-cleaning page"
- "Create a city landing page template for Mansfield, OH"

## Orchestration patterns

**Feature branch flow**
1. Main conversation: scope the feature, break into tasks
2. Delegate schema changes → `schema-agent`
3. Implement pages/components in main
4. Delegate E2E tests → `playwright-tester`
5. Delegate security audit of new endpoints → `security-reviewer`
6. Delegate PR review → `pr-reviewer`
7. Merge

**Bug fix flow**
1. Main: reproduce locally, identify root cause
2. Delegate regression test → `playwright-tester`
3. Fix in main
4. Verify test passes
5. Merge

**SEO pass**
1. Main: list all pages that need metadata
2. Delegate → `seo-agent` to generate metadata + JSON-LD for each
3. Main reviews and commits
