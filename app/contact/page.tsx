import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a free pressure washing quote or call SudsOnWheels directly. Serving Ashland and North Central Ohio.",
};

const PHONE = "4195550000";
const PHONE_DISPLAY = "(419) 555-0000";
const EMAIL = "hello@sudsonwheelsusa.com";

export default function ContactPage() {
  return (
    <main>
      <div className="grid md:grid-cols-[1fr_1.4fr] min-h-[600px]">
        {/* Left — Contact info */}
        <div className="bg-navy px-8 md:px-12 py-14 flex flex-col">
          <h1 className="text-offwhite text-3xl font-black mb-3">
            Let&apos;s talk
          </h1>
          <p className="mb-10 text-base leading-relaxed" style={{ color: "#9ab8d4" }}>
            Call, text, or fill out the form. We&apos;ll get back to you within
            one business day.
          </p>

          <div className="space-y-7">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9ab8d4" }}>
                Phone / Text
              </p>
              <a
                href={`tel:${PHONE}`}
                className="text-offwhite text-lg font-semibold hover:text-brand-red transition-colors"
              >
                {PHONE_DISPLAY}
              </a>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9ab8d4" }}>
                Email
              </p>
              <a
                href={`mailto:${EMAIL}`}
                className="text-offwhite text-base hover:text-brand-red transition-colors break-all"
              >
                {EMAIL}
              </a>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9ab8d4" }}>
                Based In
              </p>
              <p className="text-offwhite text-base">
                Ashland, OH — serving North Central Ohio
              </p>
            </div>
          </div>
        </div>

        {/* Right — Quote form */}
        <div className="px-8 md:px-12 py-14 bg-white">
          <QuoteForm />
        </div>
      </div>
    </main>
  );
}
