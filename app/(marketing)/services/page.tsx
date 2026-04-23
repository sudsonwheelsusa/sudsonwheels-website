import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ServiceIcon } from "@/lib/service-icons";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { getPublicServices } from "@/lib/site-data";
import { PHONE, PHONE_DISPLAY } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Pressure washing services for houses, driveways, decks, gutters, roof soft wash, and commercial fleet washing in Ashland and North Central Ohio.",
};

const SERVICE_DETAILS: Record<string, { features: string[]; price: string }> = {
  "House & Siding": {
    features: ["Vinyl, wood & brick siding", "Soffit & fascia cleaning", "Mold & algae removal", "Window trim brightening"],
    price: "Free estimate — pricing based on home size",
  },
  "Driveways & Concrete": {
    features: ["Concrete & asphalt driveways", "Sidewalks & walkways", "Oil & rust stain treatment", "Commercial parking lots"],
    price: "Free estimate — most driveways under 2 hours",
  },
  "Decks & Fences": {
    features: ["Wood & composite decks", "Patio pavers & stone", "Fences & pergolas", "Pre-stain surface prep"],
    price: "Free estimate — quoted by size",
  },
  "Gutters": {
    features: ["Interior debris removal", "Downspout flushing", "Exterior gutter brightening", "Problem spot reporting"],
    price: "Free estimate — most homes under an hour",
  },
  "Fleet Washing": {
    features: ["Semi trucks & trailers", "Construction & ag equipment", "Company vans & work trucks", "On-site fleet contracts available"],
    price: "Contract pricing available — call for fleet rates",
  },
  "Roof Soft Wash": {
    features: ["Low-pressure safe for shingles", "Algae & moss removal", "Extends roof lifespan", "No-damage guarantee"],
    price: "Free estimate — pricing based on roof size",
  },
};

export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <main>
      <PageHeader
        breadcrumb="Services"
        eyebrow="What We Do"
        title="Our Services"
        subtitle="Professional pressure washing for residential and commercial customers across North Central Ohio."
      />

      <section className="bg-offwhite px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => {
              const details = SERVICE_DETAILS[service.name];
              return (
                <div
                  key={service.id}
                  className={`reveal reveal-delay-${(i % 3) + 1} overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md`}
                >
                  {/* Image or icon header */}
                  <div className="relative flex h-44 items-center justify-center bg-navy">
                    {service.image_url ? (
                      <>
                        <Image
                          src={service.image_url}
                          alt={service.name}
                          fill
                          className="object-cover opacity-70"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-navy/20" />
                      </>
                    ) : (
                      <ServiceIcon name={service.icon} className="relative z-10 size-12 text-white/60" />
                    )}
                    <span className="absolute bottom-3 left-3 z-10 rounded bg-brand-red px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      {service.name}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="mb-3 text-sm leading-relaxed text-gray-500">{service.description}</p>

                    {details && (
                      <>
                        <ul className="mb-4 space-y-1.5">
                          {details.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-navy">
                              <span className="text-brand-red font-bold">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <p className="border-t border-gray-100 pt-3 text-xs text-gray-400">
                          {details.price}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="reveal mt-12 rounded-2xl bg-navy px-8 py-10 text-center text-white">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-red">Ready to get started?</p>
            <h2 className="mb-3 text-2xl font-black">Not sure what you need? We&apos;ll figure it out together.</h2>
            <p className="mb-6 text-white/60">No upsells, no pressure. Just a straight quote for what your property actually needs.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="rounded-lg bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
              >
                Get a Free Quote
              </Link>
              <a
                href={`tel:${PHONE}`}
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal />
    </main>
  );
}
