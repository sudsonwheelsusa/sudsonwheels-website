"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import OverviewSection from "./sections/OverviewSection";
import LeadsPipeline from "./sections/LeadsPipeline";
import CalendarSection from "./sections/CalendarSection";
import ServicesSection from "./sections/ServicesSection";
import GallerySection from "./sections/GallerySection";
import SettingsSection from "./sections/SettingsSection";

type Section = "overview" | "leads" | "calendar" | "services" | "gallery" | "settings";

const NAV_ICONS: Record<Section, React.ReactNode> = {
  overview: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  leads: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  services: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 0-14.14 0" /><path d="M4.93 19.07a10 10 0 0 0 14.14 0" />
    </svg>
  ),
  gallery: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  settings: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

const NAV: { key: Section; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "leads", label: "Leads" },
  { key: "calendar", label: "Calendar" },
  { key: "services", label: "Services" },
  { key: "gallery", label: "Gallery" },
  { key: "settings", label: "Settings" },
];

export default function AdminDashboard({
  initialAdminEmail,
}: {
  initialAdminEmail: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");

  useEffect(() => {
    function handleNav(e: Event) {
      const detail = (e as CustomEvent<string>).detail as Section;
      setSection(detail);
    }
    window.addEventListener("admin-navigate", handleNav);
    return () => window.removeEventListener("admin-navigate", handleNav);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile top nav */}
      <div className="md:hidden bg-navy border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-[13px] font-black tracking-tight text-white">
            Suds<span className="text-brand-red">On</span>Wheels
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
        {/* Icon-only tab bar on mobile */}
        <div className="grid grid-cols-6 border-t border-white/8">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[9px] font-semibold tracking-wide uppercase transition-colors ${
                section === item.key
                  ? "text-white border-t-2 border-brand-red -mt-px"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {NAV_ICONS[item.key]}
              <span className="hidden xs:block">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 bg-navy flex-col py-5 px-3 gap-1 sticky top-0 h-screen overflow-y-auto">
          <div className="px-2.5 mb-5 pb-4 border-b border-white/10">
            <p className="text-[13px] font-black tracking-tight text-white">
              Suds<span className="text-brand-red">On</span>Wheels
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/25 mt-0.5">
              Admin
            </p>
          </div>

          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 w-full text-[12.5px] font-medium transition-colors text-left ${
                section === item.key
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:bg-white/6 hover:text-white/75"
              }`}
            >
              {section === item.key && (
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-brand-red rounded-r-full" />
              )}
              {NAV_ICONS[item.key]}
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-white/10">
            <p className="px-2.5 mb-2 text-[9px] text-white/25 truncate">
              {initialAdminEmail}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-white/35 hover:bg-white/5 hover:text-white/60 transition-colors"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-offwhite p-4 sm:p-5 md:p-8 min-h-full">
          {section === "overview" && <OverviewSection />}
          {section === "leads" && <LeadsPipeline />}
          {section === "calendar" && (
            <Suspense fallback={<p className="text-sm text-navy/30">Loading calendar...</p>}>
              <CalendarSection />
            </Suspense>
          )}
          {section === "services" && <ServicesSection />}
          {section === "gallery" && <GallerySection />}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}
