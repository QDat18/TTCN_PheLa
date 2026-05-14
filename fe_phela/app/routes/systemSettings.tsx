import type { Route } from "./+types/systemSettings";
import SystemSettings from "~/pages/admin/SystemSettings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cài đặt Hệ thống - Phê La Admin" },
    { name: "description", content: "Quản lý cài đặt toàn bộ hệ thống Phê La" },
  ];
}

export default function SystemSettingsPage() {
  return <SystemSettings />;
}
