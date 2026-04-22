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
