import type { Route } from "./+types/branchRevenue";
import BranchRevenue from "~/pages/admin/report/BranchRevenue";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Báo cáo doanh thu chi nhánh" },
    { name: "Doanh thu chi nhánh", content: "Thống kê doanh thu theo từng chi nhánh" },
  ];
}

export default function BranchRevenuePage() {
  return <BranchRevenue />;
}
