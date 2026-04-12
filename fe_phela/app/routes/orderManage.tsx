import type { Route } from "./+types/orderManage";
import Order from "~/pages/admin/salesManage/Order";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý đơn bán hàng" },
    { name: "Đơn hàng", content: "Quản lý đơn bán hàng!" },
  ];
}

export default function HomePage() {
  return <Order />;
}
