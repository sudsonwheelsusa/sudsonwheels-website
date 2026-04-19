import Link from "next/link";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-navy tracking-tight">
          Suds<span className="text-brand-red">On</span>Wheels
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
