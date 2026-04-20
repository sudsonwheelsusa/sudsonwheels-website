import {
  CONTACT_EMAIL,
  PHONE,
  PHONE_DISPLAY,
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

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red">
            SudsOnWheels
          </p>
          <h2 className="max-w-sm text-2xl font-black text-offwhite">
            Mobile pressure washing for Ashland and North Central Ohio.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-white/60">
            Fast quotes, real before-and-after results, and an admin workflow that
            keeps every lead organized from first form submission to scheduled job.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.14em] text-white/50">
            Contact
          </p>
          <a
            href={`tel:${PHONE}`}
            className="block transition-colors hover:text-brand-red"
          >
            {PHONE_DISPLAY}
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="block break-all transition-colors hover:text-brand-red"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="text-white/50">Serving Ashland &amp; North Central Ohio</p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.14em] text-white/50">
            Follow Along
          </p>
          <div className="flex gap-3 pt-1">
            {SOCIAL_LINKS.map((link) => {
              const Icon = SOCIAL_ICONS[link.label];
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-red"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-center text-xs sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span className="text-white/50">
            &copy; {new Date().getFullYear()} SudsOnWheels
          </span>
          <span className="text-white/30">
            Quotes, estimates, gallery, and scheduling managed securely through
            Supabase.
          </span>
        </div>
      </div>
    </footer>
  );
}
