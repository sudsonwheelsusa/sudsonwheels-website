import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/constants/site";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-navy px-6 py-20 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
        404 — Page Not Found
      </p>
      <h1 className="mb-4 text-4xl font-black leading-tight text-offwhite md:text-5xl">
        Nothing to wash here.
      </h1>
      <p className="mb-10 max-w-sm text-base leading-relaxed text-blue-200/70">
        That page doesn&apos;t exist. Head back home or shoot us an email — we&apos;re easy to reach.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
        >
          Back to Home
        </Link>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-offwhite transition-colors hover:bg-white/10"
        >
          Email Us
        </a>
      </div>
    </main>
  );
}
