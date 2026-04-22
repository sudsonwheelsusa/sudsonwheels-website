import type { Metadata } from "next";
import Link from "next/link";
import BeforeAfterCard from "@/components/BeforeAfterCard";
import ServiceCard from "@/components/ServiceCard";
import { getPublicGallery, getPublicServices } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Pressure washing services for houses, driveways, decks, gutters, roof soft wash, and commercial fleet washing in Ashland and North Central Ohio.",
};

export default async function ServicesPage() {
  const [services, gallery] = await Promise.all([
    getPublicServices(),
    getPublicGallery(),
  ]);

  return (
    <main>
      <section className="border-b border-gray-200 bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
            What We Do
          </p>
          <h1 className="mb-2 text-4xl font-black text-navy">Our Services</h1>
          <p className="text-base text-gray-500">
            Professional pressure washing for residential and commercial
            customers across North Central Ohio.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              name={service.name}
              description={service.description}
              icon={service.icon}
              imageUrl={service.image_url}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
            Results
          </p>
          <h2 className="mb-2 text-3xl font-black text-navy">Before &amp; After</h2>
          <p className="mb-8 text-sm text-gray-500">
            Real jobs, real results. Photos added as we complete work.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {gallery.map((item) => (
              <BeforeAfterCard
                key={item.id}
                title={item.title}
                location={item.location}
                detail={item.detail}
                beforeImageUrl={item.before_image_url}
                afterImageUrl={item.after_image_url}
                beforeLabel={item.before_label}
                afterLabel={item.after_label}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-lg font-bold text-navy">Want results like these?</p>
            <p className="mt-0.5 text-sm text-gray-400">
              We&apos;ll give you a free estimate - no pressure.
            </p>
          </div>
          <Link
            href="/contact"
            className="whitespace-nowrap rounded-md bg-brand-red px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
          >
            Get a Free Quote
          </Link>
        </div>
      </section>
    </main>
  );
}
