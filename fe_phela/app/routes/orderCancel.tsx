import type { Route } from "./+types/orderCancel";
import OrderCancel from "~/pages/admin/salesManage/OrderCancel";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý đơn hủy hàng" },
    { name: "Hủy hàng", content: "Quản lý đơn hủy hàng!" },
  ];
}

export default function HomePage() {
  return <OrderCancel />;
}
