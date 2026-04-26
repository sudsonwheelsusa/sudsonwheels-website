# SudsOnWheels Launch Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the SudsOnWheels app for production launch: isolate the admin portal, add OWASP security headers, fix customer-facing content, and wire up full SEO.

**Architecture:** Next.js route groups split marketing pages (`(marketing)/`) and admin pages (`(admin)/`) so the portal renders with zero public navigation. Security headers live in `next.config.ts`. SEO uses Next.js file conventions (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`) plus a JSON-LD `<script>` in the root layout. All changes ship in one PR: `feature/launch-prep` → `dev` → `main`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, Supabase Auth (`@supabase/ssr`), Cloudflare Turnstile (`@marsidev/react-turnstile`), Playwright (E2E)

---

## File Map

### Created
- `app/(marketing)/layout.tsx` — wraps public pages with `<Header>` and `<Footer>`
- `app/(admin)/layout.tsx` — minimal wrapper for portal (no nav)
- `app/sitemap.ts` — static sitemap for all public pages
- `app/robots.ts` — crawl rules, disallows `/portal`
- `app/opengraph-image.tsx` — branded 1200×630 OG image
- `e2e/launch-hardening.spec.ts` — tests for security headers, SEO, portal isolation, footer content

### Moved (URL paths unchanged — route groups are transparent to the router)
- `app/page.tsx` → `app/(marketing)/page.tsx`
- `app/about/` → `app/(marketing)/about/`
- `app/services/` → `app/(marketing)/services/`
- `app/contact/` → `app/(marketing)/contact/`
- `app/gallery/` → `app/(marketing)/gallery/`
- `app/portal/` → `app/(admin)/portal/`

### Modified
- `app/layout.tsx` — remove `<Header>`/`<Footer>`, add `metadataBase`, add JSON-LD `<script>`
- `next.config.ts` — add `headers()` with CSP + OWASP headers + `/portal` X-Robots-Tag
- `components/layout/Footer.tsx` — fix company tagline, remove Supabase credit line
- `components/admin/AdminLoginForm.tsx` — map all auth errors to generic messages
- `app/(admin)/portal/page.tsx` — replace with minimal unbranded login layout
- `app/(admin)/portal/dashboard/page.tsx` — fix `min-h` calc (header offset no longer needed)

---

## Task 1: Create feature branch

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout dev
git pull
git checkout -b feature/launch-prep
```

Expected: `Switched to a new branch 'feature/launch-prep'`

---

## Task 2: Write failing E2E tests

**Files:**
- Create: `e2e/launch-hardening.spec.ts`

Write all tests first so they fail against the current codebase, then pass after each task is completed.

- [ ] **Step 1: Create the test file**

```typescript
// e2e/launch-hardening.spec.ts
import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

test("public pages include required security headers", async ({ request }) => {
  const response = await request.get("http://localhost:3000/");
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
});

test("portal route includes X-Robots-Tag noindex", async ({ request }) => {
  const response = await request.get("http://localhost:3000/portal");
  const headers = response.headers();
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
});

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

test("robots.txt disallows portal and references sitemap", async ({ request }) => {
  const response = await request.get("http://localhost:3000/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("Disallow: /portal");
  expect(body).toContain("Sitemap: https://sudsonwheelsusa.com/sitemap.xml");
});

test("sitemap.xml includes all public pages and excludes portal", async ({ request }) => {
  const response = await request.get("http://localhost:3000/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain("sudsonwheelsusa.com/");
  expect(body).toContain("sudsonwheelsusa.com/services");
  expect(body).toContain("sudsonwheelsusa.com/about");
  expect(body).toContain("sudsonwheelsusa.com/contact");
  expect(body).not.toContain("/portal");
});

test("homepage has LocalBusiness JSON-LD schema", async ({ page }) => {
  await page.goto("/");
  const jsonLd = await page.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"]');
    return script ? JSON.parse(script.textContent ?? "{}") : null;
  });
  expect(jsonLd).not.toBeNull();
  expect(jsonLd["@type"]).toBe("LocalBusiness");
  expect(jsonLd.name).toBe("SudsOnWheels");
  expect(jsonLd.telephone).toBe("+13309270080");
});

// ---------------------------------------------------------------------------
// Admin portal isolation
// ---------------------------------------------------------------------------

test("portal login page shows no main site navigation", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByRole("link", { name: "Services" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "About" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Get a Quote" })).not.toBeVisible();
});

test("portal login page has no text revealing it is admin", async ({ page }) => {
  await page.goto("/portal");
  await expect(page.getByText("Hidden Admin Access")).not.toBeVisible();
  await expect(page.getByText("admin workflow")).not.toBeVisible();
  await expect(page.getByText("Supabase auth")).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Footer content
// ---------------------------------------------------------------------------

test("footer does not expose tech stack or internal details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Supabase")).not.toBeVisible();
  await expect(page.getByText("admin workflow")).not.toBeVisible();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx playwright test e2e/launch-hardening.spec.ts --reporter=line
```

Expected: all 8 tests FAIL. If any pass unexpectedly, investigate before continuing.

- [ ] **Step 3: Commit the failing tests**

```bash
git add e2e/launch-hardening.spec.ts
git commit -m "test: add failing E2E tests for launch hardening

Tests cover: security headers, X-Robots-Tag on portal,
robots.txt, sitemap.xml, JSON-LD, portal nav isolation,
footer content. All expected to fail until tasks complete.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Route groups — isolate admin portal from marketing layout

The current root `app/layout.tsx` wraps everything with `<Header>` and `<Footer>`. To remove navigation from the portal, we split into two route groups. Route group folders use `(name)` syntax — they are invisible to the Next.js router so no URLs change.

**Files:**
- Create: `app/(marketing)/layout.tsx`
- Create: `app/(admin)/layout.tsx`
- Modify: `app/layout.tsx`
- Move: all marketing pages into `app/(marketing)/`
- Move: `app/portal/` into `app/(admin)/`

- [ ] **Step 1: Create the marketing layout**

Create `app/(marketing)/layout.tsx`:

```tsx
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create the admin layout**

Create `app/(admin)/layout.tsx`:

```tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Strip Header/Footer from root layout and add metadataBase**

Replace the full contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { validateServerEnvironment } from "@/lib/supabase/config";
import {
  PHONE,
  CONTACT_EMAIL,
  SOCIAL_LINKS,
  DEFAULT_SERVICE_AREA,
} from "@/lib/constants/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SudsOnWheels — Mobile Pressure Washing | Ashland, OH",
    template: "%s | SudsOnWheels",
  },
  description:
    "Professional mobile pressure washing serving Ashland and North Central Ohio. Houses, driveways, decks, gutters, and commercial fleet washing. Free quotes.",
  metadataBase: new URL("https://sudsonwheelsusa.com"),
  openGraph: {
    siteName: "SudsOnWheels",
    locale: "en_US",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SudsOnWheels",
  url: "https://sudsonwheelsusa.com",
  telephone: `+1${PHONE}`,
  email: CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ashland",
    addressRegion: "OH",
    addressCountry: "US",
  },
  areaServed: DEFAULT_SERVICE_AREA.map((city) => ({
    "@type": "City",
    name: city,
  })),
  sameAs: SOCIAL_LINKS.map((link) => link.href),
  priceRange: "$$",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  validateServerEnvironment();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Move marketing pages into the route group**

```bash
mkdir -p "app/(marketing)"
git mv app/page.tsx "app/(marketing)/page.tsx"
git mv app/about "app/(marketing)/about"
git mv app/services "app/(marketing)/services"
git mv app/contact "app/(marketing)/contact"
git mv app/gallery "app/(marketing)/gallery"
```

- [ ] **Step 5: Move portal into the admin route group**

```bash
mkdir -p "app/(admin)"
git mv app/portal "app/(admin)/portal"
```

- [ ] **Step 6: Start dev server and verify routes still work**

```bash
npm run dev
```

Verify manually:
- `http://localhost:3000/` — homepage loads with nav and footer ✓
- `http://localhost:3000/services` — services page loads with nav ✓
- `http://localhost:3000/portal` — login page loads with NO main nav ✓

If any page 404s, the git mv likely missed a nested file — check `git status` and move any remaining files.

- [ ] **Step 7: Fix dashboard min-h (header offset no longer applies)**

The dashboard page currently uses `min-h-[calc(100vh-8rem)]` which subtracted the header height. Since the admin layout has no header, update `app/(admin)/portal/dashboard/page.tsx` line 17:

```tsx
// Before
<main className="min-h-[calc(100vh-8rem)]">

// After
<main className="min-h-screen">
```

- [ ] **Step 8: Run type check**

```bash
npm run type-check
```

Expected: no errors. If you see "cannot find module" errors, check that all import paths still resolve after the file moves.

- [ ] **Step 9: Commit**

```bash
git add "app/(marketing)/" "app/(admin)/" app/layout.tsx
git commit -m "refactor: isolate admin portal via Next.js route groups

Marketing pages use (marketing)/layout.tsx which adds Header+Footer.
Admin portal uses (admin)/layout.tsx with no public navigation.
Root layout retains fonts, Analytics, JSON-LD, and env validation only.
metadataBase added to enable absolute OG/canonical URL generation.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Redesign admin portal login page

**Files:**
- Modify: `app/(admin)/portal/page.tsx`

The current page has a two-column layout with "Hidden Admin Access" branding and internal copy about Supabase auth. Replace it with a centered, minimal card.

- [ ] **Step 1: Replace the portal page**

Write the full new contents of `app/(admin)/portal/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminIdentity } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalPage() {
  const adminIdentity = await getAdminIdentity();

  if (adminIdentity) {
    redirect("/portal/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <AdminLoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify visually**

Navigate to `http://localhost:3000/portal` — should show a centered white card with email, password, Turnstile, and "Sign in" button. No SudsOnWheels branding, no navigation links.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/portal/page.tsx"
git commit -m "feat: replace portal login with minimal centered form

Removes 'Hidden Admin Access' heading, two-column layout, and
all copy that describes internal systems. Renders a plain centered
card with no public navigation visible.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Harden AdminLoginForm error messages

**Files:**
- Modify: `components/admin/AdminLoginForm.tsx`

Line 37 currently sets `setMessage(error.message)` — this exposes raw Supabase strings like `"Invalid login credentials"` or `"Email rate limit exceeded"` directly to the UI, which enables username enumeration (OWASP A07). Replace with generic messages.

- [ ] **Step 1: Update the error handler**

In `components/admin/AdminLoginForm.tsx`, replace lines 35–41:

```tsx
    // BEFORE (lines 35–41)
    if (error) {
      setStatus("error");
      setMessage(error.message);
      turnstileRef.current?.reset();
      setTurnstileToken("");
      return;
    }
```

With:

```tsx
    // AFTER
    if (error) {
      const isRateLimited =
        error.status === 429 ||
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("too many");
      setStatus("error");
      setMessage(
        isRateLimited
          ? "Too many attempts. Try again later."
          : "Invalid credentials."
      );
      turnstileRef.current?.reset();
      setTurnstileToken("");
      return;
    }
```

- [ ] **Step 2: Verify the form still works**

With dev server running, navigate to `http://localhost:3000/portal`. Enter a wrong password and submit. The error message should read "Invalid credentials." — not the raw Supabase string.

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminLoginForm.tsx
git commit -m "security: harden admin login error messages (OWASP A07)

Map all Supabase auth errors to generic client-facing messages.
Rate-limit errors show 'Too many attempts', all others show
'Invalid credentials.' — no information about which field failed.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Fix Footer content

**Files:**
- Modify: `components/layout/Footer.tsx`

- [ ] **Step 1: Fix the company tagline (line 49–52)**

Replace:

```tsx
          <p className="max-w-md text-sm leading-relaxed text-white/60">
            Fast quotes, real before-and-after results, and an admin workflow that
            keeps every lead organized from first form submission to scheduled job.
          </p>
```

With:

```tsx
          <p className="max-w-md text-sm leading-relaxed text-white/60">
            Licensed, insured, and based in Ashland, OH. Serving residential and
            commercial customers across North Central Ohio.
          </p>
```

- [ ] **Step 2: Remove the Supabase credit line (lines 103–106)**

Remove this entire `<span>` element:

```tsx
          <span className="text-white/30">
            Quotes, estimates, gallery, and scheduling managed securely through
            Supabase.
          </span>
```

The bottom of the footer should be left with only the copyright span:

```tsx
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-center text-xs sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span className="text-white/50">
            &copy; {new Date().getFullYear()} SudsOnWheels
          </span>
        </div>
      </div>
```

- [ ] **Step 3: Verify footer looks correct**

Navigate to `http://localhost:3000/` and scroll to the footer. Confirm: new tagline is visible, no Supabase mention anywhere in the footer.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "content: remove internal tech stack references from footer

Replace 'admin workflow' tagline with customer-facing copy.
Remove Supabase credit line — customers have no need to know
the infrastructure stack.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Add security headers

**Files:**
- Modify: `next.config.ts`

The current `next.config.ts` only has `images.remotePatterns`. Add `headers()` alongside it — preserve the existing image config.

- [ ] **Step 1: Replace the full contents of next.config.ts**

```typescript
import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qjwzvvrzqricfkkprtwk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lqeazgmbtyoopqwblygn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/portal/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify headers are present in dev**

```bash
curl -s -I http://localhost:3000/ | grep -i "x-content-type\|x-frame\|content-security\|strict-transport"
```

Expected output (order may vary):
```
x-content-type-options: nosniff
x-frame-options: DENY
content-security-policy: default-src 'self'; script-src ...
strict-transport-security: max-age=63072000; includeSubDomains; preload
```

- [ ] **Step 3: Verify portal X-Robots-Tag**

```bash
curl -s -I http://localhost:3000/portal | grep -i "x-robots"
```

Expected: `x-robots-tag: noindex, nofollow`

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "security: add OWASP security headers and CSP

Adds X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
Referrer-Policy, Permissions-Policy, HSTS, and a CSP covering
Supabase (storage + realtime), Cloudflare Turnstile, Leaflet map
tiles, and Vercel Analytics. Portal routes get X-Robots-Tag noindex.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add sitemap and robots

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 1: Create app/robots.ts**

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/portal/dashboard"],
    },
    sitemap: "https://sudsonwheelsusa.com/sitemap.xml",
  };
}
```

- [ ] **Step 2: Create app/sitemap.ts**

```typescript
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sudsonwheelsusa.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://sudsonwheelsusa.com/services",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sudsonwheelsusa.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://sudsonwheelsusa.com/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://sudsonwheelsusa.com/gallery",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
```

- [ ] **Step 3: Verify both endpoints**

```bash
curl http://localhost:3000/robots.txt
```

Expected:
```
User-Agent: *
Allow: /
Disallow: /portal
Disallow: /portal/dashboard
Sitemap: https://sudsonwheelsusa.com/sitemap.xml
```

```bash
curl http://localhost:3000/sitemap.xml | grep "<loc>"
```

Expected: 5 `<loc>` entries — home, services, about, contact, gallery. No `/portal`.

- [ ] **Step 4: Commit**

```bash
git add app/robots.ts app/sitemap.ts
git commit -m "seo: add robots.txt and sitemap.xml

Disallows /portal routes. Sitemap covers all 5 public pages with
appropriate changeFrequency and priority values.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Add OG image

**Files:**
- Create: `app/opengraph-image.tsx`

- [ ] **Step 1: Create app/opengraph-image.tsx**

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SudsOnWheels — Mobile Pressure Washing | Ashland, OH";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1D3557",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            color: "#C8102E",
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          SudsOnWheels
        </div>
        <div
          style={{
            color: "#FAF6F0",
            fontSize: 64,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Pressure Washing You Can Trust
        </div>
        <div
          style={{
            color: "#C8102E",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          Mobile Pressure Washing · Ashland, OH
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Verify OG image renders**

Navigate to `http://localhost:3000/opengraph-image` in a browser. Expected: navy background, white headline, red subheading — 1200×630.

- [ ] **Step 3: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "seo: add branded OG image (1200x630)

Navy/white/red branded card used for social link previews.
Generated at edge runtime via Next.js ImageResponse.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Run all tests and build

- [ ] **Step 1: Run type check**

```bash
npm run type-check
```

Expected: no errors. Common failure: import paths broken after git mv. If you see "Cannot find module '@/components/...'", verify the file moved correctly with `git status`.

- [ ] **Step 2: Run existing quote form E2E tests**

```bash
npx playwright test e2e/quote-form.spec.ts --reporter=line
```

Expected: all 6 tests PASS. If any fail, check that the contact page still loads correctly at `/contact`.

- [ ] **Step 3: Run new hardening E2E tests**

```bash
npx playwright test e2e/launch-hardening.spec.ts --reporter=line
```

Expected: all 8 tests PASS. If the JSON-LD test fails, confirm the `<script type="application/ld+json">` is present in the DOM on `/`.

- [ ] **Step 4: Run full build**

```bash
npm run build
```

Expected: completes successfully. Watch for any warnings about invalid CSP or missing metadata.

- [ ] **Step 5: Manual browser checklist**

With `npm run dev` running:

- [ ] `http://localhost:3000/` — footer shows "Licensed, insured..." not Supabase, JSON-LD visible in page source
- [ ] `http://localhost:3000/portal` — centered login card, no main nav, title is "Sign In"
- [ ] `http://localhost:3000/sitemap.xml` — 5 URL entries, no /portal
- [ ] `http://localhost:3000/robots.txt` — Disallow: /portal visible
- [ ] `http://localhost:3000/opengraph-image` — branded navy card renders
- [ ] Browser devtools → Network → any page → Response Headers → `content-security-policy` and `x-content-type-options` present

---

## Task 11: Open PR to dev

- [ ] **Step 1: Push feature branch**

```bash
git push -u origin feature/launch-prep
```

- [ ] **Step 2: Open PR targeting dev**

```bash
gh pr create \
  --base dev \
  --title "feat: launch prep — security, SEO, admin portal hardening, content fixes" \
  --body "$(cat <<'EOF'
## Summary

- **Admin portal isolation** — route groups (`(marketing)`, `(admin)`) so `/portal` renders with zero public navigation
- **OWASP security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes; X-Robots-Tag on portal
- **Admin login hardening** — generic error messages (no username enumeration), minimal unbranded form
- **Footer content** — removed Supabase mention and internal 'admin workflow' copy
- **SEO** — `sitemap.xml`, `robots.txt`, LocalBusiness JSON-LD, branded OG image, `metadataBase`

## Test plan

- [ ] All 6 existing E2E tests pass (`e2e/quote-form.spec.ts`)
- [ ] All 8 new hardening tests pass (`e2e/launch-hardening.spec.ts`)
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] Portal login verified: no main nav, no branding, generic error messages
- [ ] Security headers visible in browser devtools (Network tab)
- [ ] `/sitemap.xml` and `/robots.txt` accessible

## Infrastructure checklist (verify before merging to main)

- [ ] Vercel production env vars set: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `OWNER_EMAIL`, `RESEND_FROM_EMAIL`
- [ ] Custom domain `sudsonwheelsusa.com` active in Vercel with SSL
- [ ] `dev` → Preview, `main` → Production in Vercel
- [ ] Resend DKIM + SPF configured for `sudsonwheelsusa.com`
- [ ] Supabase prod: migration `20260419173000_admin_workflow.sql` applied
- [ ] Supabase prod: RLS enabled on all tables, `gallery` bucket exists with public read

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

**Spec coverage check:**
- Content fixes (footer + portal page) → Tasks 4, 6 ✓
- Admin portal enterprise hardening (error messages, no nav, no branding) → Tasks 3, 4, 5 ✓
- OWASP security headers + CSP → Task 7 ✓
- robots.txt + sitemap.xml → Task 8 ✓
- metadataBase + JSON-LD → Task 3 (layout) ✓
- OG image → Task 9 ✓
- Infrastructure checklist → Task 11 PR body ✓

**Type consistency:**
- `PHONE`, `CONTACT_EMAIL`, `SOCIAL_LINKS`, `DEFAULT_SERVICE_AREA` all imported from `lib/constants/site.ts` in Task 3 and match the exact export names in that file
- `getAdminIdentity` imported from `@/lib/auth/admin` in Task 4 — matches existing import in original portal page
- `AdminLoginForm` import path unchanged in Task 4
- `error.status` and `error.message` in Task 5 match the Supabase `AuthError` shape

**Edge cases covered:**
- Gallery page (`app/gallery/page.tsx`) is NOT empty — it's a full page, moved correctly in Task 3
- `next.config.ts` already has `images.remotePatterns` — preserved in Task 7
- Dashboard `min-h` calc updated in Task 3 Step 7 — no longer references header height
- JSON-LD placed in `<body>` (before `{children}`) per Next.js recommendation, not `<head>`
