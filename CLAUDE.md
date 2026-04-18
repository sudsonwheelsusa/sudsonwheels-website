@AGENTS.md

# Project: SudsOnWheels

Marketing site + lightweight admin CMS for a mobile pressure washing business based in Ashland, OH.

## Tech stack

- **Framework**: Next.js 15 (App Router) — see note below
- **Database**: Supabase (Postgres + Auth + Storage)
- **Email**: Resend + React Email
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Deployment**: Vercel
- **Bot protection**: Cloudflare Turnstile
- **Rate limiting**: Upstash

> **Next.js note**: This version has breaking changes — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Brand

- Navy: `#1D3557`
- Red: `#C8102E`
- Off-white: `#FAF6F0`

## Branch strategy

- `main` = production (Vercel prod deployment)
- `dev` = staging (Vercel preview)
- `feature/*` = feature work, branched from and merged back to `dev`

Never commit directly to `main`. All work flows through `dev`.

## Tier CLAUDE.md files

- `app/CLAUDE.md` — frontend conventions (pages, components, styling)
- `app/api/CLAUDE.md` — backend conventions (route handlers, Supabase clients, RLS, email)
