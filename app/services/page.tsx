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
