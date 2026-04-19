import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminIdentity } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalPage() {
  const adminIdentity = await getAdminIdentity();

  if (adminIdentity) {
    redirect("/portal/dashboard");
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-50 px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-red">
            Hidden Admin Access
          </p>
          <h1 className="max-w-xl text-4xl font-black text-navy">
            Manage services, gallery updates, quotes, and scheduling in one place.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600">
            This route is intentionally unlinked from the public site. Real protection
            still comes from Supabase auth and the single-admin role check behind it.
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  );
}
