import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import { CONTACT_EMAIL, PHONE, PHONE_DISPLAY } from "@/lib/constants/site";
import { getPublicServices } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a free pressure washing quote or call SudsOnWheels directly. Serving Ashland and North Central Ohio.",
};

export default async function ContactPage() {
  const services = await getPublicServices();

  return (
    <main>
      <div className="grid min-h-[600px] md:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col bg-navy px-8 py-14 md:px-12">
          <h1 className="mb-3 text-3xl font-black text-offwhite">
            Let&apos;s talk
          </h1>
          <p className="mb-10 text-base leading-relaxed" style={{ color: "#9ab8d4" }}>
            Call, text, or fill out the form. We&apos;ll get back to you within
            one business day.
          </p>

          <div className="space-y-7">
            <div>
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#9ab8d4" }}
              >
                Phone / Text
              </p>
              <a
                href={`tel:${PHONE}`}
                className="text-lg font-semibold text-offwhite transition-colors hover:text-brand-red"
              >
                {PHONE_DISPLAY}
              </a>
            </div>

            <div>
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#9ab8d4" }}
              >
                Email
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="break-all text-base text-offwhite transition-colors hover:text-brand-red"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div>
              <p
                className="mb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#9ab8d4" }}
              >
                Based In
              </p>
              <p className="text-base text-offwhite">
                Ashland, OH - serving North Central Ohio
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white px-8 py-14 md:px-12">
          <QuoteForm
            serviceOptions={services.map((service) => ({
              id: service.id,
              name: service.name,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
