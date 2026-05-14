import type { Route } from "./+types/complaintManagement";
import ComplaintManagement from "~/pages/admin/ComplaintManagement";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý khiếu nại - Phê La Admin" },
    { name: "description", content: "Quản lý khiếu nại của khách hàng" },
  ];
}

export default function ComplaintManagementPage() {
  return <ComplaintManagement />;
}
