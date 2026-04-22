import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminIdentity } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Sign In",
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm">
        <AdminLoginForm />
      </div>
    </main>
  );
}
