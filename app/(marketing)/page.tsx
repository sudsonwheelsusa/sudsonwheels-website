import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_SERVICE_AREA,
  CONTACT_EMAIL,
} from "@/lib/constants/site";
import { getPublicServices } from "@/lib/site-data";
import ScrollReveal from "@/components/ScrollReveal";
import TestimonialCarousel from "@/components/TestimonialCarousel";

export const metadata: Metadata = {
  title: "SudsOnWheels - Mobile Pressure Washing | Ashland, OH",
  description:
    "Professional mobile pressure washing serving Ashland and North Central Ohio. Free estimates for houses, driveways, decks, gutters, and fleet washing.",
};

const TRUST_ITEMS = [
  "Fully Insured",
  "Free Estimates",
  "Family Owned",
  "5-Star Rated",
];

const EXTENDED_SERVICE_AREA = [
  "Ashland",
  "Mansfield",
  "Loudonville",
  "Wooster",
  "Medina",
  "Ontario",
  "Millersburg",
  "Shelby",
  "Crestline",
  "Bellville",
  "Hayesville",
  "Orrville",
];

export default async function HomePage() {
  const services = await getPublicServices();
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery`;

  return (
    <main>
      {/* ── Hero ── */}
      <section className="grid min-h-screen md:grid-cols-2 overflow-hidden">
        {/* Left copy — subtle grid texture + fade-up animations */}
        <div className="hero-copy-bg relative flex flex-col justify-center bg-navy px-8 py-14 md:px-14">
          <p className="hero-eyebrow mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
            Ashland &amp; North Central Ohio
          </p>
          <h1 className="hero-title mb-4 text-4xl font-black leading-tight text-offwhite md:text-5xl">
            Pressure Washing
            <br />
            You Can Trust
          </h1>
          <p className="hero-sub mb-8 max-w-sm text-base leading-relaxed text-blue-200/70">
            Mobile pressure washing for houses, driveways, decks, gutters, and
            commercial fleets. Free estimates — no pressure.
          </p>
          <div className="hero-btns flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-brand-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
              Get a Free Quote
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-offwhite transition-colors hover:bg-white/10"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              Email Us
            </a>
          </div>

          {/* Trust checkmarks */}
          <div className="hero-trust mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-white/60">
                <svg className="h-3.5 w-3.5 shrink-0 text-brand-red" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right photo — fade-in + left-edge gradient bleed into navy */}
        <div className="hero-img relative min-h-60">
          <Image
            src={`${storageBase}/photos/after-tractor-2.jpg`}
            alt="Clean John Deere combine after pressure wash"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Gradient bleeds the photo into the navy copy panel */}
          <div className="hero-img-overlay absolute inset-0" />
        </div>
      </section>

      {/* ── Service pills ── */}
      <div className="border-y border-white/10 bg-[#142540]">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-4 scrollbar-none">
          <span className="mr-1 self-center text-[10px] font-bold uppercase tracking-widest text-white/35 whitespace-nowrap">
            We clean
          </span>
          {services.map((service) => (
            <Link
              key={service.id}
              href="/services"
              className="whitespace-nowrap rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:border-brand-red/50 hover:bg-brand-red/15 hover:text-white"
            >
              {service.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Who We Are ── */}
      <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-16 md:grid-cols-2">
        <div className="reveal">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
            Who We Are
          </p>
          <h2 className="mb-4 text-3xl font-black leading-snug text-navy">
            Local, mobile, and built for Ohio weather
          </h2>
          <p className="mb-4 text-base leading-relaxed text-gray-500">
            SudsOnWheels was built by Ashland University wrestlers — ages 21 to
            24 — who took the same discipline from the mat and put it into
            building something real. We bring the equipment to you, no haul-ins,
            no hassle. Every job gets the same care whether it&apos;s a single
            driveway or a full commercial fleet.
          </p>
          <p className="mb-6 text-base leading-relaxed text-gray-500">
            We invested in the right tools — hot-water systems for heavy grease,
            soft-wash rigs for siding, surface cleaners for concrete. No
            shortcuts, no damage. Done right or we come back.
          </p>
          <Link
            href="/about"
            className="border-b-2 border-brand-red pb-0.5 text-sm font-semibold text-navy transition-colors hover:text-brand-red"
          >
            More about us →
          </Link>

          {/* Contract badges */}
          <div className="mt-8 space-y-3">
            {[
              { name: "Valley Transportation", location: "Ashland, OH", desc: "Ongoing fleet washing — every truck leaving the yard looking sharp." },
              { name: "Scott's Industry", location: "Wooster, OH", desc: "Commercial contract providing regular pressure washing services." },
            ].map(({ name, location, desc }) => (
              <div key={name} className="flex items-start gap-3 rounded-xl border-l-4 border-brand-red bg-navy px-5 py-4 text-white">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                <div>
                  <p className="font-bold text-sm">Contracted Partner — {name}, {location}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal reveal-delay-2 space-y-5">
          <div className="relative h-56 overflow-hidden rounded-xl">
            <Image
              src={`${storageBase}/photos/before-semi-red-1.jpg`}
              alt="Fleet semi truck pressure wash job"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Real trust signals — no fake numbers */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🛡️", title: "Fully Insured", desc: "Liability coverage on every job" },
              { icon: "📋", title: "Free Estimates", desc: "No cost, no obligation" },
              { icon: "🏡", title: "Family Owned", desc: "Ashland locals serving Ashland" },
              { icon: "⚡", title: "We Come to You", desc: "Mobile service, no haul-ins" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-1.5 text-2xl">{icon}</div>
                <p className="text-sm font-bold text-navy">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-navy px-6 py-14">
        <div className="reveal mx-auto max-w-6xl">
          <p className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
            What Customers Are Saying
          </p>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ── Service Area ── */}
      <div className="bg-[#142540] px-6 py-8">
        <div className="reveal mx-auto max-w-6xl">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <svg className="h-4 w-4 text-brand-red" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            We Serve All of Ashland County &amp; Surrounding Areas
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-red/40 bg-brand-red/15 px-3.5 py-1 text-sm font-bold text-white">
              📍 Ashland, OH
            </span>
            {EXTENDED_SERVICE_AREA.filter((c) => c !== "Ashland").map((city) => (
              <span
                key={city}
                className="rounded-full border border-white/12 bg-white/6 px-3.5 py-1 text-sm text-white/70"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ScrollReveal />
    </main>
  );
}
