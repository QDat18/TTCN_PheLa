import type { Route } from "./+types/orderDetail";
import OrderDetailReport from "~/pages/admin/salesManage/OrderDetailReport";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chi tiết đơn hàng" },
    { name: "Đơn hàng", content: "Quản lý đơn hàng!" },
  ];
}

export default function HomePage() {
  return <OrderDetailReport />;
}
