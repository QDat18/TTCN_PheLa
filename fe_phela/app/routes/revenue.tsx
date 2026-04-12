import type { Route } from "./+types/revenue";
import Revenue from "~/pages/admin/report/Revenue";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Báo cáo doanh thu" },
    { name: "Doanh thu", content: "Báo cáo doanh thu!" },
  ];
}

export default function HomePage() {
  return <Revenue />;
}
