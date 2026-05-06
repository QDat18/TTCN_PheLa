import { Outlet } from "react-router";
import AdminGuard from "~/components/common/AdminGuard";
import AdminLayout from "~/components/admin/AdminLayout";

export default function AdminGuardLayout() {
  return (
    <AdminGuard>
      <AdminLayout />
    </AdminGuard>
  );
}
