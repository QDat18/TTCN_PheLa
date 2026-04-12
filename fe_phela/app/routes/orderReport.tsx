import type { Route } from "./+types/OrderReport";
import OrderReport from "~/pages/admin/report/OrderReport";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Báo cáo bán hàng" },
    { name: "Báo cáo", content: "Báo cáo bán hàng!" },
  ];
}

export default function HomePage() {
  return <OrderReport />;
}
