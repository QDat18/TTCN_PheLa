import type { Route } from "./+types/CustomerDashboard";
import Home from "~/pages/customer/HomeCustomer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trang chủ - Phê La" },
    { name: "Trang chủ", content: "Chào mừng đến Phê La!" },
  ];
}

export default function HomePage() {
  return <Home />;
}
