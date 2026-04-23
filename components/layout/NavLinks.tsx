"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-sm text-white/70 hover:text-white transition-colors px-3 py-2",
              pathname === href
                ? "text-white font-semibold border-b-2 border-brand-red pb-0.5"
                : "hover:text-white"
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/contact"
          className="ml-2 bg-brand-red text-white text-sm font-bold px-4 py-2 rounded-md hover:bg-brand-red/90 transition-colors shadow-sm"
        >
          Get a Free Quote
        </Link>
      </nav>

      {/* Mobile: hamburger + Get a Quote */}
      <div className="flex md:hidden items-center gap-3">
        <Link
          href="/contact"
          className="bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-md"
        >
          Get a Quote
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="p-2"
        >
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white mb-1" />
          <span className="block w-5 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-[#142540] border-b border-white/10 shadow-xl md:hidden z-50">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-6 py-4 text-sm text-white/70 border-b border-white/10 hover:text-white hover:bg-white/5 transition-colors",
                pathname === href && "text-white font-semibold"
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="block mx-4 my-3 bg-brand-red text-white font-bold text-sm text-center py-3 rounded-md"
          >
            Get a Free Quote
          </Link>
        </div>
      )}
    </>
  );
}
