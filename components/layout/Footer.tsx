import Image from "next/image";
import Link from "next/link";
import {
  CONTACT_EMAIL,
  SOCIAL_LINKS,
} from "@/lib/constants/site";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.264 5.636 5.9-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.56V6.8a4.85 4.85 0 0 1-1.07-.11z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "X.com": XIcon,
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
};

const SERVICE_LINKS = [
  "House & Siding",
  "Driveways & Concrete",
  "Decks & Fences",
  "Gutters",
  "Fleet Washing",
  "Roof Soft Wash",
];

const SERVICE_AREA = [
  "Ashland, OH",
  "Mansfield, OH",
  "Wooster, OH",
  "Loudonville, OH",
  "Medina, OH",
  "Ontario, OH",
  "Millersburg, OH",
  "Shelby, OH",
];

export default function Footer() {
  return (
    <footer className="bg-[#142540] text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 grid gap-10 md:grid-cols-[1.8fr_1fr_1fr_1fr]">

        {/* Brand column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.jpeg"
              alt="SudsOnWheels"
              width={56}
              height={56}
              className="object-contain rounded-full bg-white p-0.5"
            />
            <div>
              <p className="text-lg font-black tracking-tight">
                Suds<span className="text-brand-red">On</span>Wheels
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-red">
                Ashland, Ohio
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-white/60 max-w-xs">
            Family-owned mobile pressure washing for residential and commercial
            customers across Ashland County and North Central Ohio. We bring the
            equipment to you.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 bg-brand-red text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-brand-red/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Email Us
          </a>
          <div className="flex gap-2 pt-1">
            {SOCIAL_LINKS.map((link) => {
              const Icon = SOCIAL_ICONS[link.label];
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-brand-red"
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                </a>
              );
            })}
          </div>
        </div>

        {/* Services column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
            Services
          </p>
          <ul className="space-y-2.5">
            {SERVICE_LINKS.map((name) => (
              <li key={name}>
                <Link
                  href="/services"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
            Company
          </p>
          <ul className="space-y-2.5">
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About Us" },
              { href: "/gallery", label: "Gallery" },
              { href: "/contact", label: "Get a Quote" },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-white/60 hover:text-white transition-colors break-all"
              >
                Email Us
              </a>
            </li>
          </ul>
        </div>

        {/* Service area column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
            Service Area
          </p>
          <ul className="space-y-2.5">
            {SERVICE_AREA.map((city) => (
              <li key={city} className="text-sm text-white/60">
                {city}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-xs text-white/35">
          <span>&copy; {new Date().getFullYear()} SudsOnWheels — Ashland, Ohio. All rights reserved.</span>
          <span>Contracted partners: Valley Transportation (Ashland) · Scott&apos;s Industry (Wooster)</span>
        </div>
      </div>
    </footer>
  );
}
