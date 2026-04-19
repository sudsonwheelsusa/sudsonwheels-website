import {
  CONTACT_EMAIL,
  PHONE,
  PHONE_DISPLAY,
  SOCIAL_LINKS,
} from "@/lib/constants/site";

export default function Footer() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red">
            SudsOnWheels
          </p>
          <h2 className="max-w-sm text-2xl font-black text-offwhite">
            Mobile pressure washing for Ashland and North Central Ohio.
          </h2>
          <p className="max-w-md text-sm leading-relaxed" style={{ color: "#9ab8d4" }}>
            Fast quotes, real before-and-after results, and an admin workflow that
            keeps every lead organized from first form submission to scheduled job.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p
            className="font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#9ab8d4" }}
          >
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
          <p style={{ color: "#9ab8d4" }}>Serving Ashland &amp; North Central Ohio</p>
        </div>

        <div className="space-y-3 text-sm">
          <p
            className="font-semibold uppercase tracking-[0.14em]"
            style={{ color: "#9ab8d4" }}
          >
            Follow Along
          </p>
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="block transition-colors hover:text-brand-red"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-center text-xs sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span style={{ color: "#9ab8d4" }}>
            &copy; {new Date().getFullYear()} SudsOnWheels
          </span>
          <span style={{ color: "#6e86a0" }}>
            Quotes, estimates, gallery, and scheduling managed securely through
            Supabase.
          </span>
        </div>
      </div>
    </footer>
  );
}
