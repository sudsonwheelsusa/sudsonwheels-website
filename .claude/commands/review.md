---
description: Review the current branch before opening a PR
---

You're reviewing the current branch before the user opens a PR. Do not make code changes — produce a review report.

Steps:

1. **Verify local state** — run:
   - `git status` (should be clean or nearly so)
   - `git log main..HEAD --oneline` (list commits in this branch)
   - `git diff main..HEAD --stat` (scope of changes)

2. **Run local checks**:
   - `npm run lint` — report any errors or warnings
   - `npm run type-check` (or `tsc --noEmit`) — report type errors
   - `npm run build` — confirm production build succeeds
   - If Playwright tests exist: `npx playwright test` — report pass/fail

3. **Delegate to `security-reviewer`** — pass the diff for a security audit

4. **Delegate to `pr-reviewer`** — pass the diff for a code quality review

5. **Synthesize the reports** into a single summary:
   ```
   # Pre-PR Review — <branch>

   ## Local checks
   - Lint: ✅ pass / ❌ N errors
   - Typecheck: ✅ pass / ❌ N errors
   - Build: ✅ pass / ❌ failing
   - Tests: ✅ pass / ❌ N failing

   ## Security (from security-reviewer)
   [summary]

   ## Quality (from pr-reviewer)
   [summary]

   ## Recommendation
   - Ready to PR, or
   - Fix the following before PR: [list]
   ```

6. **If ready**, suggest the PR title and description.

Arguments: $ARGUMENTS (optional extra context)
