# Frontend (app/)

## Pages & Components

- Prefer Server Components; only add `"use client"` when you need browser APIs, event handlers, or React hooks
- Co-locate page-specific components in `app/<route>/_components/`
- Shared UI lives in `components/ui/` (shadcn primitives) or `components/` (composed)
- Use `<Image>` from `next/image` for all raster images — never `<img>`
- Every page exports `metadata` — see `app/api/CLAUDE.md` for the SEO agent pattern

## Styling

- Tailwind v4 utility classes only — no inline styles except for truly dynamic values
- Brand tokens: navy `#1D3557`, red `#C8102E`, off-white `#FAF6F0`
- Mobile-first: design starts at 375px, expand up
- shadcn/ui for interactive primitives (Button, Dialog, Form, etc.) — check the registry before building from scratch

## Forms

- React Hook Form + Zod for all user-facing forms
- Client schema and server Zod schema must match
- Always handle: loading state, success state, error state
- Turnstile widget required on all public forms

## Accessibility

- Semantic HTML over `<div>` soup
- All images have meaningful `alt` text (empty string only for decorative)
- Form inputs have associated `<label>` elements
- Interactive elements keyboard-operable

## Do Not

- Don't fetch data client-side for content that can be server-rendered
- Don't use `any` — use `unknown` + narrowing or proper types
- Don't hardcode brand hex values — use Tailwind config tokens
- Don't ship console.log statements
