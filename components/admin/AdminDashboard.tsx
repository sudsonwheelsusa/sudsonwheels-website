"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import OverviewSection from "./sections/OverviewSection";
import LeadsPipeline from "./sections/LeadsPipeline";
import CalendarSection from "./sections/CalendarSection";
import ServicesSection from "./sections/ServicesSection";
import GallerySection from "./sections/GallerySection";

type Section = "overview" | "leads" | "calendar" | "services" | "gallery";

const NAV: { key: Section; label: string; emoji: string }[] = [
  { key: "overview", label: "Overview", emoji: "📊" },
  { key: "leads", label: "Leads", emoji: "📥" },
  { key: "calendar", label: "Calendar", emoji: "📅" },
  { key: "services", label: "Services", emoji: "🔧" },
  { key: "gallery", label: "Gallery", emoji: "🖼" },
];

export default function AdminDashboard({
  initialAdminEmail,
}: {
  initialAdminEmail: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile top nav */}
      <div className="md:hidden bg-navy border-b border-white/10">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">SudsOnWheels</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-blue-300 hover:text-white transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </div>
        <div className="flex overflow-x-auto gap-1 px-3 pb-2 scrollbar-none">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                section === item.key
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-52 shrink-0 bg-navy flex-col py-6 px-3 gap-1">
          <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-widest text-blue-300">
            SudsOnWheels
          </p>

          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                section === item.key
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="mt-auto">
            <p className="px-3 mb-2 text-[10px] text-blue-400 truncate">
              {initialAdminEmail}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6 md:p-8">
          {section === "overview" && <OverviewSection />}
          {section === "leads" && <LeadsPipeline />}
          {section === "calendar" && <CalendarSection />}
          {section === "services" && <ServicesSection />}
          {section === "gallery" && <GallerySection />}
        </main>
      </div>
    </div>
  );
}
