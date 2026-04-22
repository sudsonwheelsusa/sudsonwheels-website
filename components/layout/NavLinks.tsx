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
      <nav className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-sm text-gray-600 hover:text-navy transition-colors",
              pathname === href &&
                "text-navy font-semibold border-b-2 border-brand-red pb-0.5"
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/contact"
          className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-navy/90 transition-colors"
        >
          Get a Quote
        </Link>
      </nav>

      {/* Mobile: hamburger + Get a Quote */}
      <div className="flex md:hidden items-center gap-3">
        <Link
          href="/contact"
          className="bg-navy text-white text-xs font-semibold px-3 py-2 rounded-md"
        >
          Get a Quote
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="p-2 text-navy"
        >
          <span className="block w-5 h-0.5 bg-navy mb-1" />
          <span className="block w-5 h-0.5 bg-navy mb-1" />
          <span className="block w-5 h-0.5 bg-navy" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-md md:hidden z-50">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-6 py-4 text-sm text-gray-600 border-b border-gray-100",
                pathname === href && "text-navy font-semibold"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
