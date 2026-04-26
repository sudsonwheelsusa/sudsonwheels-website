# SudsOnWheels Site UI Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full SudsOnWheels marketing site — Home, Services, About, and Contact pages — with a working quote-request form backed by Supabase, Resend email, Cloudflare Turnstile, and Upstash rate limiting.

**Architecture:** Next.js 15 App Router with Server Components by default. `QuoteForm` and `NavLinks` are the only client components. The API route at `/api/leads` handles form submission server-side. All brand tokens live as CSS custom properties in `globals.css`.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui, React Hook Form + Zod v4, Supabase SSR, Resend, @marsidev/react-turnstile, Upstash Redis

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/globals.css` | Modify | Add brand color tokens |
| `app/layout.tsx` | Modify | Add site-level metadata |
| `components/layout/Header.tsx` | Rewrite | Nav with logo, links, CTA |
| `components/layout/NavLinks.tsx` | Create | Client component for active-link detection |
| `components/layout/Footer.tsx` | Rewrite | Dark footer, 3-column |
| `app/page.tsx` | Rewrite | Home page — all sections |
| `components/ServiceCard.tsx` | Create | Service card with image slot |
| `components/BeforeAfterCard.tsx` | Create | Before/after image pair |
| `app/services/page.tsx` | Create | Services page |
| `app/about/page.tsx` | Create | About page |
| `lib/schemas/lead.ts` | Create | Zod schema for quote form |
| `lib/supabase/server.ts` | Create | Supabase server client |
| `supabase/migrations/0001_leads.sql` | Create | leads table + RLS |
| `components/QuoteForm.tsx` | Create | Client form component |
| `app/contact/page.tsx` | Create | Contact page |
| `app/api/leads/route.ts` | Create | Form submission API route |

---

## Task 1: Brand color tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add brand tokens to the `@theme inline` block**

Open `app/globals.css`. Inside the existing `@theme inline { ... }` block, add these lines at the end (before the closing `}`):

```css
  --color-navy: #1D3557;
  --color-navy-dark: #111d2b;
  --color-brand-red: #C8102E;
  --color-offwhite: #FAF6F0;
```

After the edit the end of `@theme inline` should look like:

```css
@theme inline {
  /* ... all existing tokens ... */
  --color-navy: #1D3557;
  --color-navy-dark: #111d2b;
  --color-brand-red: #C8102E;
  --color-offwhite: #FAF6F0;
}
```

- [ ] **Step 2: Verify tokens are available**

Run the dev server (`npm run dev`) and confirm it starts without errors. Stop it after confirming.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add brand color tokens to theme"
```

---

## Task 2: Site-level metadata

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add metadata export**

Replace the entire contents of `app/layout.tsx` with:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
  openGraph: {
    siteName: "SudsOnWheels",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add site-level metadata to root layout"
```

---

## Task 3: NavLinks (client component)

**Files:**
- Create: `components/layout/NavLinks.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-sm text-gray-600 hover:text-navy transition-colors",
              pathname === href &&
                "text-navy font-semibold border-b-2 border-brand-red pb-0.5"
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/contact"
          className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-navy/90 transition-colors"
        >
          Get a Quote
        </Link>
      </nav>

      {/* Mobile: hamburger + Get a Quote */}
      <div className="flex md:hidden items-center gap-3">
        <Link
          href="/contact"
          className="bg-navy text-white text-xs font-semibold px-3 py-2 rounded-md"
        >
          Get a Quote
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="p-2 text-navy"
        >
          <span className="block w-5 h-0.5 bg-navy mb-1" />
          <span className="block w-5 h-0.5 bg-navy mb-1" />
          <span className="block w-5 h-0.5 bg-navy" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-md md:hidden z-50">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-6 py-4 text-sm text-gray-600 border-b border-gray-100",
                pathname === href && "text-navy font-semibold"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/NavLinks.tsx
git commit -m "feat: add NavLinks client component with mobile menu"
```

---

## Task 4: Header

**Files:**
- Rewrite: `components/layout/Header.tsx`

- [ ] **Step 1: Rewrite the header**

```typescript
import Link from "next/link";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-navy tracking-tight">
          Suds<span className="text-brand-red">On</span>Wheels
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Run dev server and confirm header renders**

`npm run dev` — open browser, confirm logo and nav appear. Stop server.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat: rewrite header with logo and responsive nav"
```

---

## Task 5: Footer

**Files:**
- Rewrite: `components/layout/Footer.tsx`

- [ ] **Step 1: Rewrite the footer**

```typescript
export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <span className="font-bold text-sm">SudsOnWheels</span>
        <span className="text-sm" style={{ color: "#9ab8d4" }}>
          Serving Ashland &amp; North Central Ohio
        </span>
        <span className="text-xs" style={{ color: "#445566" }}>
          &copy; {new Date().getFullYear()} SudsOnWheels
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "feat: rewrite footer with dark background and 3-column layout"
```

---

## Task 6: Home page

**Files:**
- Rewrite: `app/page.tsx`

- [ ] **Step 1: Rewrite the home page**

```typescript
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SudsOnWheels — Mobile Pressure Washing | Ashland, OH",
  description:
    "Professional mobile pressure washing serving Ashland and North Central Ohio. Free estimates for houses, driveways, decks, gutters, and fleet washing.",
};

const PHONE = "4195550000";
const PHONE_DISPLAY = "(419) 555-0000";

const SERVICES = [
  "House & Siding",
  "Driveways & Concrete",
  "Decks & Fences",
  "Gutters",
  "Fleet Washing",
  "Roof Soft Wash",
];

const CITIES = [
  "Ashland",
  "Mansfield",
  "Wooster",
  "Loudonville",
  "Medina",
  "Ontario",
];

export default function HomePage() {
  return (
    <main>
      {/* Split Hero */}
      <section className="grid md:grid-cols-2 min-h-[420px]">
        <div className="bg-navy px-8 md:px-14 py-14 flex flex-col justify-center">
          <p className="text-brand-red text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Ashland &amp; North Central Ohio
          </p>
          <h1 className="text-offwhite text-4xl md:text-5xl font-black leading-tight mb-4">
            Pressure Washing<br />You Can Trust
          </h1>
          <p className="text-blue-200/70 text-base leading-relaxed mb-8 max-w-sm">
            Mobile pressure washing for houses, driveways, decks, gutters, and
            commercial fleets. Free estimates — no pressure.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="bg-brand-red text-white font-bold text-sm px-5 py-3 rounded-md hover:bg-brand-red/90 transition-colors"
            >
              Get a Free Quote
            </Link>
            <a
              href={`tel:${PHONE}`}
              className="border border-white/40 text-offwhite font-semibold text-sm px-5 py-3 rounded-md hover:bg-white/10 transition-colors"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
        <div className="bg-slate-200 flex items-center justify-center min-h-[240px]">
          {/* Replace with: <Image src="/images/hero.jpg" alt="SudsOnWheels truck" fill className="object-cover" /> */}
          <p className="text-slate-400 text-sm text-center px-8">
            Photo coming soon
          </p>
        </div>
      </section>

      {/* Service Pills */}
      <section className="bg-gray-50 border-y border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mr-2">
            We clean
          </span>
          {SERVICES.map((s) => (
            <span
              key={s}
              className="border border-gray-300 text-navy text-sm font-medium px-4 py-1.5 rounded-full bg-white"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* About Snippet */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-brand-red text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            Who We Are
          </p>
          <h2 className="text-navy text-3xl font-black leading-snug mb-4">
            Local, mobile, and built for Ohio weather
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            We&apos;re a family-owned pressure washing business based in
            Ashland, OH. We bring the equipment to you — no haul-ins, no
            hassle. Residential and commercial jobs welcome.
          </p>
          <Link
            href="/about"
            className="text-navy font-semibold text-sm border-b-2 border-brand-red pb-0.5 hover:text-brand-red transition-colors"
          >
            More about us →
          </Link>
        </div>
        <div className="bg-slate-200 rounded-xl h-52 flex items-center justify-center">
          {/* Replace with: <Image src="/images/owner.jpg" alt="Owner" fill className="object-cover rounded-xl" /> */}
          <p className="text-slate-400 text-sm">Photo coming soon</p>
        </div>
      </section>

      {/* Service Area Strip */}
      <section className="bg-navy py-10 px-6 text-center">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: "#9ab8d4" }}>
          We Serve
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {CITIES.map((city, i) => (
            <span key={city} className="text-offwhite text-sm font-medium">
              {city}
              {i < CITIES.length - 1 && (
                <span className="text-brand-red ml-6">·</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-gray-100 py-16 px-6 text-center">
        <h2 className="text-navy text-3xl font-black mb-3">
          Ready for a cleaner property?
        </h2>
        <p className="text-gray-500 text-base mb-8">
          Get a free, no-obligation quote. We&apos;ll get back to you fast.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="bg-brand-red text-white font-bold text-base px-6 py-3 rounded-md hover:bg-brand-red/90 transition-colors"
          >
            Request a Free Quote
          </Link>
          <a
            href={`tel:${PHONE}`}
            className="border-2 border-navy text-navy font-semibold text-base px-6 py-3 rounded-md hover:bg-navy hover:text-white transition-colors"
          >
            Call or Text Us
          </a>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Run dev server and review home page**

`npm run dev` — open `http://localhost:3000`. Confirm all sections render: split hero, pills, about, area strip, CTA. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: build home page with all sections"
```

---

## Task 7: ServiceCard component

**Files:**
- Create: `components/ServiceCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
interface ServiceCardProps {
  name: string;
  description: string;
  icon: string;
}

export default function ServiceCard({ name, description, icon }: ServiceCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="bg-slate-200 h-36 flex items-center justify-center relative">
        {/* Replace inner div with:
            <Image src={imageSrc} alt={name} fill className="object-cover" />
            once real photos are available. Add imageSrc: string to props. */}
        <span className="text-4xl" role="img" aria-label={name}>
          {icon}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-navy font-bold text-sm mb-1.5">{name}</h3>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ServiceCard.tsx
git commit -m "feat: add ServiceCard component with image placeholder"
```

---

## Task 8: BeforeAfterCard component

**Files:**
- Create: `components/BeforeAfterCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
interface BeforeAfterCardProps {
  title: string;
  location: string;
  detail: string;
  beforeIcon: string;
  afterIcon: string;
}

export default function BeforeAfterCard({
  title,
  location,
  detail,
  beforeIcon,
  afterIcon,
}: BeforeAfterCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="grid grid-cols-2">
        <div className="bg-slate-300 h-28 flex items-center justify-center relative">
          {/* Replace with <Image src={beforeSrc} alt="Before" fill className="object-cover" /> */}
          <span className="absolute top-2 left-2 bg-black/55 text-white text-[9px] font-bold px-2 py-0.5 rounded">
            BEFORE
          </span>
          <span className="text-3xl" role="img" aria-label="before">
            {beforeIcon}
          </span>
        </div>
        <div className="bg-blue-200 h-28 flex items-center justify-center relative">
          {/* Replace with <Image src={afterSrc} alt="After" fill className="object-cover" /> */}
          <span className="absolute top-2 left-2 bg-navy text-white text-[9px] font-bold px-2 py-0.5 rounded">
            AFTER
          </span>
          <span className="text-3xl" role="img" aria-label="after">
            {afterIcon}
          </span>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-navy font-bold text-sm">{title}</p>
        <p className="text-gray-400 text-[11px] mt-0.5">
          {location} · {detail}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/BeforeAfterCard.tsx
git commit -m "feat: add BeforeAfterCard component with placeholder slots"
```

---

## Task 9: Services page

**Files:**
- Create: `app/services/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import BeforeAfterCard from "@/components/BeforeAfterCard";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Pressure washing services for houses, driveways, decks, gutters, roof soft wash, and commercial fleet washing in Ashland and North Central Ohio.",
};

const SERVICES = [
  {
    name: "House & Siding",
    description:
      "Remove dirt, mold, and mildew from your home's exterior. Safe for vinyl, wood, and brick.",
    icon: "🏠",
  },
  {
    name: "Driveways & Concrete",
    description:
      "Strip stains, oil, and grime from concrete and paver surfaces. Looks like new.",
    icon: "🚗",
  },
  {
    name: "Decks & Fences",
    description:
      "Prep your deck or fence for staining, or just restore it to its natural color.",
    icon: "🌲",
  },
  {
    name: "Gutters",
    description:
      "Flush debris and built-up grime from your gutters and downspouts.",
    icon: "🍂",
  },
  {
    name: "Fleet Washing",
    description:
      "Keep your commercial vehicles looking sharp. We come to your lot on a schedule.",
    icon: "🚛",
  },
  {
    name: "Roof Soft Wash",
    description:
      "Low-pressure treatment to safely remove algae and staining from shingles.",
    icon: "🏚️",
  },
];

const GALLERY = [
  {
    title: "House Wash — Ashland, OH",
    location: "Ashland, OH",
    detail: "Vinyl siding · Full exterior",
    beforeIcon: "🏠",
    afterIcon: "✨",
  },
  {
    title: "Driveway — Mansfield, OH",
    location: "Mansfield, OH",
    detail: "Concrete · Oil stain removal",
    beforeIcon: "🚗",
    afterIcon: "✨",
  },
  {
    title: "Deck Wash — Wooster, OH",
    location: "Wooster, OH",
    detail: "Cedar deck · Pre-stain prep",
    beforeIcon: "🌲",
    afterIcon: "✨",
  },
  {
    title: "Fleet Wash — Ontario, OH",
    location: "Ontario, OH",
    detail: "4 vehicles · Monthly contract",
    beforeIcon: "🚛",
    afterIcon: "✨",
  },
];

export default function ServicesPage() {
  return (
    <main>
      {/* Page Hero */}
      <section className="bg-gray-50 border-b border-gray-200 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            What We Do
          </p>
          <h1 className="text-navy text-4xl font-black mb-2">Our Services</h1>
          <p className="text-gray-500 text-base">
            Professional pressure washing for residential and commercial
            customers across North Central Ohio.
          </p>
        </div>
      </section>

      {/* Service Card Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <ServiceCard
              key={s.name}
              name={s.name}
              description={s.description}
              icon={s.icon}
            />
          ))}
        </div>
      </section>

      {/* Before & After Gallery */}
      <section className="bg-gray-50 border-t border-gray-200 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            Results
          </p>
          <h2 className="text-navy text-3xl font-black mb-2">Before &amp; After</h2>
          <p className="text-gray-500 text-sm mb-8">
            Real jobs, real results. Photos added as we complete work.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {GALLERY.map((item) => (
              <BeforeAfterCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bar */}
      <section className="border-t border-gray-200 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-navy font-bold text-lg">Want results like these?</p>
            <p className="text-gray-400 text-sm mt-0.5">
              We&apos;ll give you a free estimate — no pressure.
            </p>
          </div>
          <Link
            href="/contact"
            className="bg-brand-red text-white font-bold text-sm px-6 py-3 rounded-md hover:bg-brand-red/90 transition-colors whitespace-nowrap"
          >
            Get a Free Quote
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Confirm in browser**

`npm run dev` — open `http://localhost:3000/services`. Confirm card grid and gallery render. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/services/page.tsx
git commit -m "feat: build services page with card grid and before/after gallery"
```

---

## Task 10: About page

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Family-owned mobile pressure washing based in Ashland, OH. Learn about SudsOnWheels and the team behind the work.",
};

const VALUES = [
  "Free estimates, no obligation",
  "Residential and commercial",
  "Fully insured",
  "Locally owned & operated",
];

export default function AboutPage() {
  return (
    <main>
      {/* Page Hero */}
      <section className="bg-gray-50 border-b border-gray-200 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            Our Story
          </p>
          <h1 className="text-navy text-4xl font-black mb-2">
            About SudsOnWheels
          </h1>
          <p className="text-gray-500 text-base">
            Family-owned pressure washing based in Ashland, Ohio.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-start">
        <div className="bg-slate-200 rounded-xl h-64 flex items-center justify-center">
          {/* Replace with <Image src="/images/owner.jpg" alt="Owner" fill className="object-cover rounded-xl" /> */}
          <p className="text-slate-400 text-sm">Photo coming soon</p>
        </div>
        <div>
          <h2 className="text-navy text-2xl font-black mb-4 leading-snug">
            Built on showing up and doing it right
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-4">
            SudsOnWheels started with a simple idea: bring professional-grade
            pressure washing directly to homeowners and businesses in Ashland
            and the surrounding area, without the hassle or the big-company
            pricing.
          </p>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            We&apos;re local, we&apos;re mobile, and we stand behind our work.
            Every job gets the same attention whether it&apos;s a single
            driveway or a full commercial fleet.
          </p>
          <ul className="space-y-3">
            {VALUES.map((v) => (
              <li key={v} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0" />
                <span className="text-gray-700 text-sm">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Bar */}
      <section className="border-t border-gray-200 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-navy font-bold text-lg">Ready to get started?</p>
            <p className="text-gray-400 text-sm mt-0.5">
              Reach out and we&apos;ll set up a time that works for you.
            </p>
          </div>
          <Link
            href="/contact"
            className="bg-brand-red text-white font-bold text-sm px-6 py-3 rounded-md hover:bg-brand-red/90 transition-colors whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Confirm in browser**

`npm run dev` — open `http://localhost:3000/about`. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat: build about page"
```

---

## Task 11: Lead Zod schema

**Files:**
- Create: `lib/schemas/lead.ts`

- [ ] **Step 1: Create the schema**

```typescript
import { z } from "zod";

export const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[\d\s\-().+]+$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  service: z.string().min(1, "Select a service"),
  message: z.string().optional(),
  turnstile_token: z.string().min(1, "Bot verification required"),
});

export type LeadInput = z.infer<typeof leadSchema>;
```

- [ ] **Step 2: Run type-check to verify schema exports are valid**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/schemas/lead.ts
git commit -m "feat: add Zod schema for lead form"
```

---

## Task 12: Supabase server client

**Files:**
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Create the utility**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — read-only, ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/server.ts
git commit -m "feat: add Supabase server client utility"
```

---

## Task 13: Leads table migration

**Files:**
- Create: `supabase/migrations/0001_leads.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Create leads table
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  phone       text not null,
  email       text not null,
  service     text not null,
  message     text,
  created_at  timestamptz not null default now()
);

-- Enable RLS (anon cannot read leads — only service role / dashboard)
alter table public.leads enable row level security;

-- Anon can insert (submit a lead), but cannot read
create policy "anon can insert leads"
  on public.leads
  for insert
  to anon
  with check (true);
```

- [ ] **Step 2: Apply the migration**

If using Supabase CLI locally:
```bash
supabase db push
```

If applying via the Supabase dashboard: go to SQL Editor, paste the contents of the file, and run it.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_leads.sql
git commit -m "feat: add leads table migration with RLS"
```

---

## Task 14: Install Turnstile and build QuoteForm

**Files:**
- Create: `components/QuoteForm.tsx`

- [ ] **Step 1: Install Turnstile package**

```bash
npm install @marsidev/react-turnstile
```

- [ ] **Step 2: Add Turnstile env vars to `.env.local`**

Add these lines to `.env.local` (get keys from the Cloudflare Turnstile dashboard):

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

For local development, use Cloudflare's test keys:
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

- [ ] **Step 3: Create the QuoteForm component**

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { leadSchema, type LeadInput } from "@/lib/schemas/lead";

const SERVICES = [
  "House & Siding",
  "Driveways & Concrete",
  "Decks & Fences",
  "Gutters",
  "Fleet Washing",
  "Roof Soft Wash",
  "Not sure — need a recommendation",
];

export default function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const turnstileRef = useRef<{ reset: () => void }>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
  });

  async function onSubmit(data: LeadInput) {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
      reset();
      turnstileRef.current?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      turnstileRef.current?.reset();
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <span className="text-4xl mb-4">✅</span>
        <h3 className="text-navy font-bold text-lg mb-2">Quote request sent!</h3>
        <p className="text-gray-500 text-sm">
          We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h3 className="text-navy font-black text-lg mb-1">Request a Free Quote</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            First Name
          </label>
          <input
            {...register("first_name")}
            placeholder="Jane"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.first_name && (
            <p className="text-brand-red text-xs mt-1">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Last Name
          </label>
          <input
            {...register("last_name")}
            placeholder="Smith"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.last_name && (
            <p className="text-brand-red text-xs mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="(419) 555-0000"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.phone && (
            <p className="text-brand-red text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="jane@email.com"
            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
          {errors.email && (
            <p className="text-brand-red text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Service Needed
        </label>
        <select
          {...register("service")}
          className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="">Select a service...</option>
          {SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.service && (
          <p className="text-brand-red text-xs mt-1">{errors.service.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Anything else? (optional)
        </label>
        <textarea
          {...register("message")}
          rows={3}
          placeholder="Address, job size, timing, etc."
          className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy/30 resize-none"
        />
      </div>

      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => setValue("turnstile_token", token)}
        onError={() => setValue("turnstile_token", "")}
        onExpire={() => setValue("turnstile_token", "")}
      />
      {errors.turnstile_token && (
        <p className="text-brand-red text-xs">{errors.turnstile_token.message}</p>
      )}

      {status === "error" && (
        <p className="text-brand-red text-sm bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-red text-white font-bold text-sm py-3 rounded-md hover:bg-brand-red/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending..." : "Send Quote Request"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/QuoteForm.tsx package.json package-lock.json
git commit -m "feat: add QuoteForm with Turnstile bot protection"
```

---

## Task 15: Contact page

**Files:**
- Create: `app/contact/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a free pressure washing quote or call SudsOnWheels directly. Serving Ashland and North Central Ohio.",
};

const PHONE = "4195550000";
const PHONE_DISPLAY = "(419) 555-0000";
const EMAIL = "hello@sudsonwheelsusa.com";

export default function ContactPage() {
  return (
    <main>
      <div className="grid md:grid-cols-[1fr_1.4fr] min-h-[600px]">
        {/* Left — Contact info */}
        <div className="bg-navy px-8 md:px-12 py-14 flex flex-col">
          <h1 className="text-offwhite text-3xl font-black mb-3">
            Let&apos;s talk
          </h1>
          <p className="mb-10 text-base leading-relaxed" style={{ color: "#9ab8d4" }}>
            Call, text, or fill out the form. We&apos;ll get back to you within
            one business day.
          </p>

          <div className="space-y-7">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9ab8d4" }}>
                Phone / Text
              </p>
              <a
                href={`tel:${PHONE}`}
                className="text-offwhite text-lg font-semibold hover:text-brand-red transition-colors"
              >
                {PHONE_DISPLAY}
              </a>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9ab8d4" }}>
                Email
              </p>
              <a
                href={`mailto:${EMAIL}`}
                className="text-offwhite text-base hover:text-brand-red transition-colors break-all"
              >
                {EMAIL}
              </a>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9ab8d4" }}>
                Based In
              </p>
              <p className="text-offwhite text-base">
                Ashland, OH — serving North Central Ohio
              </p>
            </div>
          </div>
        </div>

        {/* Right — Quote form */}
        <div className="px-8 md:px-12 py-14 bg-white">
          <QuoteForm />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Confirm in browser**

`npm run dev` — open `http://localhost:3000/contact`. Confirm two-column layout, form renders, Turnstile widget appears. Stop server.

- [ ] **Step 3: Commit**

```bash
git add app/contact/page.tsx
git commit -m "feat: build contact page with quote form"
```

---

## Task 16: API route — POST /api/leads

**Files:**
- Create: `app/api/leads/route.ts`

**Prerequisites:** `.env.local` must contain:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TURNSTILE_SECRET_KEY=
RESEND_API_KEY=
OWNER_EMAIL=your@email.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/schemas/lead";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: false,
});

const resend = new Resend(process.env.RESEND_API_KEY);

async function verifyTurnstile(token: string): Promise<boolean> {
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  // 1. Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";

  const { success: withinLimit } = await ratelimit.limit(ip);
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 3. Validate with Zod
  const result = leadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const { turnstile_token, ...lead } = result.data;

  // 4. Verify Turnstile
  const turnstileOk = await verifyTurnstile(turnstile_token);
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Bot verification failed. Please try again." },
      { status: 400 }
    );
  }

  // 5. Insert into Supabase
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("leads").insert(lead);
  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 }
    );
  }

  // 6. Send notification email
  await resend.emails.send({
    from: "SudsOnWheels <noreply@sudsonwheelsusa.com>",
    to: process.env.OWNER_EMAIL!,
    subject: `New quote request — ${lead.first_name} ${lead.last_name}`,
    text: [
      `Name: ${lead.first_name} ${lead.last_name}`,
      `Phone: ${lead.phone}`,
      `Email: ${lead.email}`,
      `Service: ${lead.service}`,
      lead.message ? `Message: ${lead.message}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Test form submission locally**

`npm run dev` — go to `http://localhost:3000/contact`, fill out the form, submit. Check:
- Network tab: POST `/api/leads` returns `200 { success: true }`
- Supabase dashboard: row appears in `leads` table
- Owner email inbox: notification arrives

- [ ] **Step 4: Commit**

```bash
git add app/api/leads/route.ts
git commit -m "feat: add /api/leads route with rate limiting, Turnstile, Supabase, and Resend"
```

---

## Task 17: Final verification

- [ ] **Step 1: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors or warnings.

- [ ] **Step 3: Production build check**

```bash
npm run build
```

Expected: build completes with no errors. Review any warnings.

- [ ] **Step 4: Smoke test all pages**

`npm run dev` — visit each page and confirm no console errors:
- `http://localhost:3000` — home
- `http://localhost:3000/services` — services + gallery
- `http://localhost:3000/about` — about
- `http://localhost:3000/contact` — contact form

- [ ] **Step 5: Commit if any lint/build fixes were made**

```bash
git add -p
git commit -m "fix: address lint and build warnings"
```

---

## Task 18: E2E test — quote form flow

Dispatch the `playwright-tester` subagent with this prompt:

> Write a Playwright E2E test for the SudsOnWheels quote form at `/contact`. Use Cloudflare Turnstile test keys (site key `1x00000000000000000000AA`) so the widget auto-passes. The test should:
> 1. Navigate to `/contact`
> 2. Fill in all required fields (first name, last name, phone, email, select a service)
> 3. Submit the form
> 4. Assert the success message "Quote request sent!" appears
> 5. Assert no console errors occurred
>
> Also write a test that submits an empty form and asserts validation errors appear for the required fields.

---

*Plan complete.*
