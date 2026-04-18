---
description: Refresh your understanding of the project after context gets stale or across sessions
---

Your context may be stale or incomplete. Do a structured refresh before continuing the session.

Steps:

1. **Read the foundational docs**:
   - `CLAUDE.md` (root)
   - `AGENTS.md`
   - `app/CLAUDE.md` (if exists)
   - `app/api/CLAUDE.md` (if exists)

2. **Survey the repo**:
   - `ls -la` at root
   - Read `package.json` — what's installed and what scripts are available
   - Read `next.config.ts` and `tsconfig.json`
   - Look at `app/` top-level directory structure

3. **Check current git state**:
   - `git branch --show-current`
   - `git status`
   - `git log --oneline -10`

4. **Check env parity**:
   - Read `.env.example` for required variables
   - Do not read `.env.local` (secrets — respect .gitignore)

5. **Check open work**:
   - `gh pr list` (any open PRs?)
   - `gh issue list` (any open issues?)

6. **Summarize**:
   - Where we are (branch, last commits)
   - What's in flight (open PRs, uncommitted changes)
   - What's next (based on the user's recent instructions)

Then ask the user what they want to work on.

Arguments: $ARGUMENTS (optional — specific area to focus the refresh)
