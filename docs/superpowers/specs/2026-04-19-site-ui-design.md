# SudsOnWheels — Site UI Design

**Date:** 2026-04-19  
**Status:** Approved

---

## Goals

Primary objective: get visitors to make contact — either call/text the phone number or submit a quote request form. Both CTAs appear throughout the site.

---

## Style

- **Palette:** Navy `#1D3557`, Red `#C8102E`, Off-white `#FAF6F0`, White `#fff`, Light gray `#f8f9fa`
- **Feel:** Clean & Professional — light backgrounds, navy accents, rounded corners (6–10px), subtle borders
- **Typography:** System sans-serif stack; heavy weight (800–900) for headings, regular for body
- **Images:** Stock placeholders now; real photos (truck, job results) swapped in later. All image slots are clearly marked.

---

## Navigation (shared)

- Logo left: `SudsOnWheels` with "On" in red
- Links right: Home · Services · About · Contact
- Rightmost nav item: `Get a Quote` button (navy background)
- Active page indicated with red underline border-bottom

---

## Pages

### Home (`/`)

Sections in order:

1. **Split Hero** — Left half: navy background, red tag line ("Ashland & North Central Ohio"), H1 ("Pressure Washing You Can Trust"), body copy, two CTAs: `Get a Free Quote` (red button) + `Call (419) 555-0000` (ghost button). Right half: photo slot (stock → real truck/job photo later).

2. **Service Pills Strip** — Light gray bar listing all 6 services as outlined pills: House & Siding · Driveways & Concrete · Decks & Fences · Gutters · Fleet Washing · Roof Soft Wash.

3. **About Snippet** — Two columns: left = headline + 2 short paragraphs + "More about us →" link. Right = owner/crew photo slot.

4. **Service Area Strip** — Full-width navy bar listing served cities: Ashland · Mansfield · Wooster · Loudonville · Medina · Ontario.

5. **Contact CTA** — Centered section: "Ready for a cleaner property?" headline, subtext, two buttons: `Request a Free Quote` (red) + `Call or Text Us` (navy outline).

6. **Footer** — Dark (`#111d2b`): logo left, service area center, copyright right.

---

### Services (`/services`)

1. **Page Hero** — Light gray banner: red tag "What We Do", H1 "Our Services", one-line description.

2. **Service Card Grid** — 3-column grid. Each card: photo slot (130px tall image area, stock → real photo later), service name, short description. Services: House & Siding, Driveways & Concrete, Decks & Fences, Gutters, Fleet Washing, Roof Soft Wash.

3. **Before & After Gallery** — Light gray section below grid. 2-column grid of before/after pairs. Each pair: side-by-side image slots (left = darker "BEFORE" badge, right = navy "AFTER" badge), caption with job location and type. Placeholder pairs for: house wash, driveway, deck, fleet. Real photos added as jobs are completed.

4. **CTA Bar** — "Want results like these?" + `Get a Free Quote` button.

---

### About (`/about`)

1. **Page Hero** — Light gray banner: red tag "Our Story", H1 "About SudsOnWheels".

2. **Body** — Two columns: left = owner/crew photo slot. Right = headline, 2 paragraphs of copy, 4 value bullets (free estimates, residential + commercial, fully insured, locally owned).

3. **CTA Bar** — "Ready to get started?" + `Contact Us` button.

---

### Contact (`/contact`)

Two-column layout:

- **Left (navy background):** "Let's talk" headline, subtext, contact items: phone/text, email, location.
- **Right (white):** "Request a Free Quote" form with fields: First Name, Last Name, Phone, Email, Service (dropdown of all 6 services + "Not sure"), Message textarea, Submit button (red, full width).

Form submission: sends lead to Supabase `leads` table + triggers email notification via Resend. Requires Cloudflare Turnstile bot protection. Rate limited via Upstash.

---

## Components

| Component | Location | Notes |
|---|---|---|
| `Header` | `components/layout/Header.tsx` | Nav with logo, links, CTA button |
| `Footer` | `components/layout/Footer.tsx` | Dark footer, 3 columns |
| Service card | `components/ServiceCard.tsx` | Image slot + name + description |
| Before/after pair | `components/BeforeAfterCard.tsx` | Side-by-side image slots with badges |
| Quote form | `components/QuoteForm.tsx` | React Hook Form + Zod, Turnstile |

---

## Images

All image slots use `next/image` with a placeholder blur. When real photos are available, drop them in and update the `src`. No layout changes needed.

---

## Out of Scope

- Individual service detail pages (e.g. `/services/driveway-cleaning`) — deferred
- City/service-area landing pages — deferred (SEO agent later)
- Admin CMS / gallery upload UI — separate feature
- Blog — not planned
