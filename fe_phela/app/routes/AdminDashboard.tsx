import type { Route } from "./+types/AdminDashboard";
import Home from "~/pages/admin/HomeAdmin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trang chủ - Phê La" },
    { name: "Trang chủ", content: "Chào mừng đến Phê La!" },
  ];
}

export default function HomePage() {
  return <Home />;
}
