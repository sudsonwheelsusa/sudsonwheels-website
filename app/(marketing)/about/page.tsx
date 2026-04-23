import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import MapEmbed from "@/components/MapEmbed";

export const metadata: Metadata = {
  title: "About",
  description:
    "Family-owned mobile pressure washing based in Ashland, OH. Learn about SudsOnWheels and the team behind the work.",
};

const TRUST_CARDS = [
  { icon: "🛡️", title: "Fully Insured", desc: "Liability coverage on every single job — protecting your property and ours" },
  { icon: "📋", title: "Free Estimates", desc: "No cost, no obligation — we assess and quote before we ever start" },
  { icon: "✅", title: "Satisfaction Guaranteed", desc: "Not happy? We come back and make it right, no argument" },
  { icon: "🏡", title: "Family Owned", desc: "Ashland locals supporting Ashland locals — this is home turf" },
  { icon: "⚡", title: "Fast Scheduling", desc: "Usually booked within a few days of your call" },
  { icon: "🚐", title: "Mobile Service", desc: "We bring everything to you — no dropoff, no hassle" },
];

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        breadcrumb="About"
        eyebrow="Our Story"
        title="About SudsOnWheels"
        subtitle="Family-owned pressure washing based in Ashland, Ohio."
      />

      <section className="bg-offwhite px-6 py-14">
        <div className="mx-auto max-w-6xl">

          {/* Story + badge */}
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div className="reveal">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">Built on Honest Work</p>
              <h2 className="mb-5 text-3xl font-black leading-snug text-navy">
                We started this because we cared about doing it right
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-gray-500">
                <p>
                  SudsOnWheels was built by a group of Ashland University wrestlers who decided
                  to channel that same discipline and work ethic into something of their own.
                  Average age 21. No franchise, no middleman — when you call, you&apos;re talking
                  to the owners. When we show up, we&apos;re the ones holding the wand.
                </p>
                <p>
                  We bought the equipment we&apos;d want showing up at our own property — hot-water
                  systems, soft-wash rigs, surface cleaners. Not the bare minimum. The tools that
                  do the job without damaging what you&apos;ve got.
                </p>
                <p>
                  Ashland is home. We trained here, we compete here, and now we work here.
                  We want our community&apos;s properties to look good — and we want to be the
                  reason they do.
                </p>
              </div>

              {/* Contract badges */}
              <div className="mt-8 space-y-3">
                {[
                  {
                    name: "Valley Transportation",
                    location: "Ashland, OH",
                    desc: "Ongoing fleet washing contract. Every truck leaving the yard looks sharp.",
                  },
                  {
                    name: "Scott's Industry",
                    location: "Wooster, OH",
                    desc: "Commercial contract providing regular pressure washing services.",
                  },
                ].map(({ name, location, desc }) => (
                  <div key={name} className="flex items-start gap-3 rounded-xl border-l-4 border-brand-red bg-navy px-5 py-4 text-white">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-bold">Contracted Partner — {name}, {location}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/65">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust cards */}
            <div className="reveal reveal-delay-2">
              <div className="grid grid-cols-2 gap-3">
                {TRUST_CARDS.map(({ icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-2 text-2xl">{icon}</div>
                    <p className="text-sm font-bold text-navy">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="reveal mt-14">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">Service Area</p>
            <h2 className="mb-5 text-2xl font-black text-navy">Based in Ashland — We Come to You</h2>
            <div className="overflow-hidden rounded-2xl border-2 border-navy shadow-md">
              <MapEmbed size="md" zoom={11} />
            </div>
          </div>

          {/* CTA */}
          <div className="reveal mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-8 py-6 shadow-sm sm:flex-row">
            <div>
              <p className="font-bold text-navy">Ready to get started?</p>
              <p className="mt-0.5 text-sm text-gray-400">Reach out and we&apos;ll set up a time that works for you.</p>
            </div>
            <Link
              href="/contact"
              className="whitespace-nowrap rounded-lg bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <ScrollReveal />
    </main>
  );
}
