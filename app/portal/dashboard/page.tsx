import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const adminIdentity = await requireAdmin();

  return (
    <main className="min-h-[calc(100vh-8rem)]">
      <AdminDashboard initialAdminEmail={adminIdentity.email} />
    </main>
  );
}
