# SudsOnWheels — Launch Prep Design

**Date:** 2026-04-21  
**Branch:** `feature/launch-prep` (from `dev`)  
**Approach:** Single PR covering all domains — content, security, SEO, admin portal hardening

---

## Overview

Pre-launch hardening pass for sudsonwheelsusa.com. The app has solid foundations (Zod validation, RLS policies, Turnstile + rate limiting, proper Supabase client separation) but has meaningful gaps in security headers, SEO generation, content cleanliness, and admin portal UX. All changes ship together in one PR to `dev`, tested, then merged to `main`.

---

## Section 1 — Content Fixes

**Files affected:** `components/layout/Footer.tsx`, `app/portal/page.tsx`

### Footer
- **Line 51**: Remove "and an admin workflow that keeps every lead organized from first form submission to scheduled job." Replace with customer-facing copy: *"Licensed, insured, and based in Ashland, OH."*
- **Lines 104–106**: Remove the `<span>` that says "Quotes, estimates, gallery, and scheduling managed securely through Supabase." entirely. This exposes the tech stack to customers and serves no user-facing purpose.

### Admin portal login page (`app/portal/page.tsx`)
- Remove the "Hidden Admin Access" heading — it's conspicuous and reveals intent
- Replace with a minimal, unbranded sign-in form: no SudsOnWheels logo, no navigation visible to unauthenticated users, no descriptive heading
- Neutral label only: "Sign in" or no heading at all
- Generic error messages: always return "Invalid credentials" regardless of whether the email or password is wrong (prevents username enumeration — OWASP A07)
- Disable submit button + show "Too many attempts" when the API returns 429

### What we're NOT doing
- "Photo coming soon" on about page — handled in a separate task
- Gallery test data — dev Supabase project only, prod project has clean data

---

## Section 2 — Admin Portal Security (Enterprise Standard)

**Files affected:** `app/portal/page.tsx` (combined with Section 1 edits), `components/admin/AdminLoginForm.tsx`, `next.config.ts`

### Login UX hardening
- Minimal unbranded form: email input, password input, submit button
- No heading that reveals this is an admin route
- Error handling: catch both "Invalid login credentials" and rate-limit (429) responses from Supabase auth, map both to generic user-facing messages
- Submit button disabled during in-flight request (already standard with RHF, confirm it's implemented)

### Route hardening
- `X-Robots-Tag: noindex, nofollow` header on all `/portal/*` routes via `next.config.ts` (defense in depth — metadata directive alone is not enough if a crawler ignores it)
- Confirm `requireAdmin()` in `lib/auth/admin.ts` hard-redirects to `/portal` on every dashboard page load (it does per audit — no change needed, just verified)

### Session security
- Supabase SSR package already sets `httpOnly` session cookies — no change needed
- No MFA, IP allowlisting, or audit logs at this stage — post-launch enhancements

---

## Section 3 — Security Headers (OWASP)

**Files affected:** `next.config.ts`

Add a `headers()` async function to `next.config.ts` that applies to all routes (`source: '/(.*)'`), plus a second matcher specifically for `/portal/:path*`.

### Headers applied to all routes

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |

### Content Security Policy

Applied to all routes via `Content-Security-Policy` header:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
style-src 'self' 'unsafe-inline';
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com https://va.vercel-scripts.com;
frame-src https://challenges.cloudflare.com;
img-src 'self' data: blob: https://*.tile.openstreetmap.org;
font-src 'self';
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
```

**Notes:**
- `'unsafe-inline'` in `script-src` is required by Next.js App Router (inline bootstrap scripts). A nonce-based CSP would remove this but requires middleware — noted as a post-launch upgrade.
- `geolocation=(self)` in Permissions-Policy allows the address map picker to request location.
- Supabase realtime uses `wss://` — included in `connect-src`.
- Vercel Analytics/Speed Insights endpoints included in `connect-src`.

### Additional header for `/portal/*`

```
X-Robots-Tag: noindex, nofollow
```

---

## Section 4 — SEO

**Files affected:** `app/sitemap.ts` (new), `app/robots.ts` (new), `app/layout.tsx`, `app/opengraph-image.tsx` (new)

### `app/robots.ts`
```
User-Agent: *
Allow: /
Disallow: /portal
Disallow: /portal/dashboard
Sitemap: https://sudsonwheelsusa.com/sitemap.xml
```

### `app/sitemap.ts`
Static entries with appropriate metadata:

| URL | changeFrequency | priority |
|---|---|---|
| `https://sudsonwheelsusa.com` | `weekly` | `1.0` |
| `https://sudsonwheelsusa.com/services` | `monthly` | `0.8` |
| `https://sudsonwheelsusa.com/about` | `monthly` | `0.7` |
| `https://sudsonwheelsusa.com/contact` | `monthly` | `0.8` |

### `app/layout.tsx` — `metadataBase` + JSON-LD

Add to existing `metadata` export:
```ts
metadataBase: new URL('https://sudsonwheelsusa.com')
```

Add JSON-LD `<script>` tag in the `<head>` via the layout's `<html>` block:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "SudsOnWheels",
  "url": "https://sudsonwheelsusa.com",
  "telephone": "+13309270080",
  "email": "contact@sudsonwheelsusa.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ashland",
    "addressRegion": "OH",
    "addressCountry": "US"
  },
  "areaServed": [
    "Ashland", "Mansfield", "Wooster", "Loudonville", "Medina", "Ontario"
  ],
  "sameAs": [
    "<X_URL>",
    "<INSTAGRAM_URL>",
    "<TIKTOK_URL>"
  ],
  "priceRange": "$$"
}
```

Social URLs pulled from `lib/constants/site.ts` `SOCIAL_LINKS` array at build time — no hardcoding.

### `app/opengraph-image.tsx`
Next.js built-in OG image generation (`ImageResponse`). Design: navy (`#1D3557`) background, "SudsOnWheels" in white bold, tagline "Mobile Pressure Washing · Ashland, OH" in red (`#C8102E`). Size: 1200×630.

---

## Section 5 — Infrastructure Checklist (manual, not code)

These are owner-verified items, not part of the PR.

### Vercel
- [ ] All env vars from `.env.example` set in **Production** environment: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `OWNER_EMAIL`, `RESEND_FROM_EMAIL`
- [ ] Custom domain `sudsonwheelsusa.com` added with active SSL
- [ ] `dev` branch → Preview deployment, `main` branch → Production deployment

### GitHub
- [ ] Branch protection on `main`: require PR, require CI status checks, no direct pushes
- [ ] Branch protection on `dev`: no force pushes

### Resend
- [ ] DKIM + SPF DNS records configured for `sudsonwheelsusa.com`
- [ ] `RESEND_FROM_EMAIL` set to a `@sudsonwheelsusa.com` address

### Supabase (production project)
- [ ] Migration `20260419173000_admin_workflow.sql` applied to prod
- [ ] RLS enabled on all tables (confirm in dashboard)
- [ ] `gallery` storage bucket exists, public read enabled

---

## Out of Scope

- TanStack Query — not needed; content is largely static server-rendered
- MFA / IP allowlisting for admin — post-launch enhancement
- Nonce-based CSP — post-launch enhancement
- Photo content on about page — separate task
- Cloudflare WAF beyond Turnstile — not needed at this stage

---

## Done State

The PR is ready to merge to `main` when:
1. `next build` passes with no type errors
2. Existing Playwright E2E tests pass
3. Security headers verified in browser devtools (Network tab → response headers)
4. Sitemap accessible at `/sitemap.xml`, robots at `/robots.txt`
5. JSON-LD validates at schema.org validator
6. Admin portal login shows minimal unbranded form
7. Infrastructure checklist items verified by owner
