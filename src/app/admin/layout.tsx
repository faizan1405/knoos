import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/ui/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAdmin();
  if (authResult instanceof Response) {
    // requireAdmin returned a NextResponse — redirect will be handled client-side
    // In production this would redirect. For now render nothing on unauthorized.
    return null;
  }

  return (
    <div className="min-h-screen flex bg-brand-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
