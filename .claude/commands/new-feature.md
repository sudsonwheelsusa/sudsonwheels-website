---
description: Start a new feature — create branch, scope work, plan implementation
---

You're starting work on a new feature for SudsOnWheels. Follow this exact flow:

1. **Understand the feature** — ask the user 1-2 clarifying questions if the scope is unclear. What is the user-facing behavior? What's the acceptance criteria?

2. **Check the current branch** — run `git status` and `git branch --show-current`. If not on `dev`, remind the user to switch: `git checkout dev && git pull`.

3. **Create the feature branch** — suggest a name in the form `feature/<short-kebab-description>`. Example: `feature/gallery-upload`, `feature/city-landing-pages`. Run `git checkout -b <name>`.

4. **Break down the work** — produce a checklist of changes:
   - Database migrations (if any) — delegate design to `schema-agent`
   - New or modified types
   - Route handlers
   - Pages/components
   - Tests (E2E + unit if needed)
   - Documentation updates

5. **Identify dependencies** — any new npm packages needed? Any new env variables? Flag these upfront.

6. **Start implementation** — work through the checklist. Delegate to subagents where appropriate (schema-agent for DB, playwright-tester for tests, seo-agent for metadata).

7. **When done** — run local dev, smoke test manually, then hand off for PR review.

Arguments: $ARGUMENTS (feature description from user)
