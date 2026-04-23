import Link from "next/link";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumb?: string;
}

export default function PageHeader({ eyebrow, title, subtitle, breadcrumb }: PageHeaderProps) {
  return (
    <div className="page-header-arch bg-navy px-6 pb-16 pt-10">
      <div className="relative z-10 mx-auto max-w-6xl">
        {breadcrumb && (
          <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
            <Link href="/" className="transition-colors hover:text-white/70">Home</Link>
            <span>/</span>
            <span>{breadcrumb}</span>
          </div>
        )}
        {eyebrow && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-black text-white md:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/60">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
