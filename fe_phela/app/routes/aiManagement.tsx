import type { Route } from "./+types/aiManagement";
import AiManagement from "~/pages/admin/AiManagement";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản trị AI - Phê La" },
    { name: "description", content: "Quản lý hệ thống trí tuệ nhân tạo Phê La" },
  ];
}

export default function AiManagementRoute() {
  return <AiManagement />;
}
