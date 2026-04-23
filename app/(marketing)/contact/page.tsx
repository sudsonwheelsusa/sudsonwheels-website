import type { Metadata } from "next";
import type { ReactNode } from "react";
import QuoteForm from "@/components/QuoteForm";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";
import { CONTACT_EMAIL } from "@/lib/constants/site";
import { getPublicServices } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a free pressure washing quote from SudsOnWheels. Serving Ashland and North Central Ohio.",
};

const CONTACT_METHODS: Array<{ label: string; value: string; href: string | null; icon: ReactNode }> = [
  {
    label: "Email Us",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
  {
    label: "Serving",
    value: "Ashland, OH & Surrounding Counties",
    href: null,
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
];

const NEXT_STEPS = [
  "Submit the form or give us a call",
  "We follow up same day — by call or text",
  "You get a straight, no-surprise quote",
  "We schedule, show up, and do the work right",
];

export default async function ContactPage() {
  const services = await getPublicServices();

  return (
    <main>
      <PageHeader
        breadcrumb="Contact"
        eyebrow="Get in Touch"
        title="Get a Free Quote"
        subtitle="Tell us what you need — we'll get back to you same day."
      />

      <section className="bg-offwhite px-6 py-14">
        <div className="mx-auto grid max-w-6xl items-start gap-10 md:grid-cols-[1fr_1.2fr]">

          {/* Left — contact info */}
          <div className="reveal space-y-4">
            <div>
              <h2 className="text-2xl font-black text-navy">Talk to a Real Person</h2>
              <p className="mt-2 text-base leading-relaxed text-gray-500">
                We&apos;re a small local operation — when you reach out, you&apos;re talking to the
                owners. No call center runaround. Just straight answers and fair pricing.
              </p>
            </div>

            {/* Contact method cards */}
            {CONTACT_METHODS.map(({ label, value, href, icon }) => {
              const inner = (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
                    {icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="font-bold text-navy">{value}</p>
                  </div>
                </>
              );
              return href ? (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-brand-red/30 hover:translate-x-1"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm"
                >
                  {inner}
                </div>
              );
            })}

            {/* What happens next */}
            <div className="rounded-xl bg-navy px-5 py-5 text-white">
              <p className="mb-3 font-bold">👋 What happens next?</p>
              <ol className="space-y-1.5 text-sm leading-relaxed text-white/70 list-decimal list-inside">
                {NEXT_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>

          </div>

          {/* Right — form */}
          <div className="reveal reveal-delay-2 rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
            <h3 className="mb-6 text-xl font-black text-navy">Request a Free Quote</h3>
            <QuoteForm
              serviceOptions={services.map((s) => ({ id: s.id, name: s.name }))}
            />
          </div>
        </div>
      </section>

      <ScrollReveal />
    </main>
  );
}
