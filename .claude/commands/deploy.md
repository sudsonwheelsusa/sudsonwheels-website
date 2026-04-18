---
description: Merge dev to main and ship to production
---

Deploy the current state of `dev` to production via `main`. This assumes `dev` has been reviewed and is ready to ship.

Steps:

1. **Verify `dev` is clean**:
   - `git checkout dev && git pull`
   - `git status` should be clean
   - Last Vercel preview deployment for dev must be green (ask the user to confirm)

2. **Remind about env parity**:
   - Any new env variables added this cycle must be in Vercel Production environment before merge
   - Any new secrets used in CI must be in GitHub Secrets
   - Ask the user to confirm both

3. **Create the PR**:
   - `git checkout main && git pull`
   - Open a PR from `dev` → `main` via `gh pr create --base main --head dev`
   - Title: "Deploy: <date> <brief summary of changes>"
   - Body: list the feature branches merged into dev since last deploy

4. **Wait for CI** — GitHub Actions must pass, Vercel preview must be green

5. **Merge** — merge the PR (use merge commit, not squash, to preserve feature commit history)

6. **Post-deploy verification**:
   - Remind user to hit https://sudsonwheelsusa.com once deploy completes (~2 min)
   - Check the Vercel deployments page for success
   - Smoke test: homepage loads, contact form submits end-to-end
   - Check Sentry for new errors in the first 10 min (once wired)

7. **Tag the release** (optional):
   - `git tag -a v0.X.0 -m "Deploy: <summary>" && git push --tags`

Arguments: $ARGUMENTS (deploy summary or version bump)
