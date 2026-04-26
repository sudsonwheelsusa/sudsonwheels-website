import Image from "next/image";
import Link from "next/link";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="w-full bg-navy sticky top-0 z-50 shadow-md">
      <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/Logo.jpeg"
            alt="SudsOnWheels"
            width={44}
            height={44}
            className="object-contain rounded-full bg-white p-0.5"
            priority
          />
          <span className="text-xl font-black text-white tracking-tight">
            Suds<span className="text-brand-red">On</span>Wheels
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
