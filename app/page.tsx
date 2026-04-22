import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_SERVICE_AREA,
  PHONE,
  PHONE_DISPLAY,
} from "@/lib/constants/site";
import { getPublicServices } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "SudsOnWheels - Mobile Pressure Washing | Ashland, OH",
  description:
    "Professional mobile pressure washing serving Ashland and North Central Ohio. Free estimates for houses, driveways, decks, gutters, and fleet washing.",
};

export default async function HomePage() {
  const services = await getPublicServices();
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery`;

  return (
    <main>
      <section className="grid min-h-[420px] md:grid-cols-2">
        <div className="flex flex-col justify-center bg-navy px-8 py-14 md:px-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
            Ashland &amp; North Central Ohio
          </p>
          <h1 className="mb-4 text-4xl font-black leading-tight text-offwhite md:text-5xl">
            Pressure Washing
            <br />
            You Can Trust
          </h1>
          <p className="mb-8 max-w-sm text-base leading-relaxed text-blue-200/70">
            Mobile pressure washing for houses, driveways, decks, gutters, and
            commercial fleets. Free estimates - no pressure.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-md bg-brand-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
            >
              Get a Free Quote
            </Link>
            <a
              href={`tel:${PHONE}`}
              className="rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-offwhite transition-colors hover:bg-white/10"
            >
              Call {PHONE_DISPLAY}
            </a>
          </div>
        </div>
        <div className="relative min-h-60">
          <Image
            src={`${storageBase}/photos/after-tractor-2.jpg`}
            alt="Clean John Deere combine after pressure wash"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            We clean
          </span>
          {services.map((service) => (
            <span
              key={service.id}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-navy"
            >
              {service.name}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
            Who We Are
          </p>
          <h2 className="mb-4 text-3xl font-black leading-snug text-navy">
            Local, mobile, and built for Ohio weather
          </h2>
          <p className="mb-6 text-base leading-relaxed text-gray-500">
            We&apos;re a family-owned pressure washing business based in Ashland,
            OH. We bring the equipment to you - no haul-ins, no hassle.
            Residential and commercial jobs welcome.
          </p>
          <Link
            href="/about"
            className="border-b-2 border-brand-red pb-0.5 text-sm font-semibold text-navy transition-colors hover:text-brand-red"
          >
            More about us →
          </Link>
        </div>
        <div className="relative h-52 overflow-hidden rounded-xl">
          <Image
            src={`${storageBase}/photos/before-semi-red-1.jpg`}
            alt="Fleet semi truck pressure wash job"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="bg-navy px-6 py-10 text-center">
        <p
          className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "#9ab8d4" }}
        >
          We Serve
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {DEFAULT_SERVICE_AREA.map((city, index) => (
            <span key={city} className="text-sm font-medium text-offwhite">
              {city}
              {index < DEFAULT_SERVICE_AREA.length - 1 ? (
                <span className="ml-6 text-brand-red">·</span>
              ) : null}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-100 px-6 py-16 text-center">
        <h2 className="mb-3 text-3xl font-black text-navy">
          Ready for a cleaner property?
        </h2>
        <p className="mb-8 text-base text-gray-500">
          Get a free, no-obligation quote. We&apos;ll get back to you fast.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-md bg-brand-red px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-red/90"
          >
            Request a Free Quote
          </Link>
          <a
            href={`tel:${PHONE}`}
            className="rounded-md border-2 border-navy px-6 py-3 text-base font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
          >
            Call or Text Us
          </a>
        </div>
      </section>
    </main>
  );
}
