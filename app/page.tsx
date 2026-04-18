import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SudsOnWheels — Mobile Power Washing | Coming Soon",
  description:
    "Professional mobile power washing serving Ashland and North Central Ohio. Houses, driveways, decks, gutters, and commercial fleet washing. Free quotes — launching soon.",
  openGraph: {
    title: "SudsOnWheels — Mobile Power Washing",
    description:
      "Professional mobile power washing serving Ashland and North Central Ohio.",
    url: "https://sudsonwheelsusa.com",
    siteName: "SudsOnWheels",
    locale: "en_US",
    type: "website",
  },
};

const PHONE = "4195550000"; // replace with real number
const PHONE_DISPLAY = "(419) 555-0000"; // replace with real number

const services = [
  "House & Siding",
  "Driveways & Concrete",
  "Decks & Fences",
  "Gutters",
  "Fleet Washing",
  "Roof Soft Wash",
];

const cities = [
  "Ashland",
  "Mansfield",
  "Wooster",
  "Loudonville",
  "Mount Vernon",
  "Galion",
];

export default function ComingSoon() {
  return (
    <main
      style={{ backgroundColor: "#1D3557" }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 font-sans"
    >
      <div className="w-full max-w-2xl flex flex-col items-center text-center">

        {/* Badge */}
        <span
          style={{ backgroundColor: "#C8102E", color: "#FAF6F0" }}
          className="text-xs font-bold tracking-[3px] uppercase px-4 py-2 rounded-sm mb-8"
        >
          Coming Soon
        </span>

        {/* Logo */}
        <h1
          style={{ color: "#FAF6F0" }}
          className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-3"
        >
          Suds
          <span style={{ color: "#C8102E" }}>On</span>
          Wheels
        </h1>

        {/* Tagline */}
        <p
          style={{ color: "#7A9ABF" }}
          className="text-xs font-semibold tracking-[4px] uppercase mb-8"
        >
          Mobile Power Washing · Ashland, Ohio
        </p>

        {/* Divider */}
        <div
          style={{ backgroundColor: "#C8102E" }}
          className="w-12 h-0.5 mb-10"
        />

        {/* Headline */}
        <p
          style={{ color: "#FAF6F0" }}
          className="text-xl sm:text-2xl font-semibold leading-snug mb-4 max-w-md"
        >
          Professional exterior cleaning —<br />we come to you.
        </p>

        {/* Sub copy */}
        <p
          style={{ color: "#7A9ABF" }}
          className="text-sm leading-relaxed max-w-sm mb-10"
        >
          Serving Ashland and North Central Ohio. Full site launching soon.
          In the meantime, call or text for a free quote — we respond fast.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12 w-full sm:w-auto">
          <a
            href={`tel:+1${PHONE}`}
            style={{ backgroundColor: "#C8102E", color: "#FAF6F0" }}
            className="px-8 py-4 rounded text-sm font-bold tracking-wide text-center hover:opacity-90 transition-opacity"
          >
            Call {PHONE_DISPLAY}
          </a>
          <a
            href={`sms:+1${PHONE}`}
            style={{
              backgroundColor: "transparent",
              color: "#FAF6F0",
              border: "1.5px solid #4A6A8A",
            }}
            className="px-8 py-4 rounded text-sm font-semibold tracking-wide text-center hover:border-opacity-80 transition-opacity"
          >
            Send a Text
          </a>
        </div>

        {/* Service pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {services.map((s) => (
            <span
              key={s}
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#7A9ABF",
                border: "0.5px solid rgba(255,255,255,0.1)",
              }}
              className="text-xs px-4 py-2 rounded-full tracking-wide"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Footer service area */}
        <div
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
          className="w-full pt-6"
        >
          <p
            style={{ color: "#3A5A7A" }}
            className="text-xs tracking-[2px] uppercase"
          >
            {cities.join(" · ")} & surrounding areas
          </p>
        </div>
      </div>
    </main>
  );
}