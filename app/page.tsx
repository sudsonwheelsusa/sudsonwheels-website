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