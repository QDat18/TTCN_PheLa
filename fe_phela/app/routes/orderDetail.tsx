import type { Route } from "./+types/orderDetail";
import OrderDetail from "~/pages/customer/order/OrderDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chi tiết đơn hàng" },
    { name: "Đơn hàng", content: "Lịch sử đơn hàng!" },
  ];
}

export default function HomePage() {
  return <OrderDetail />;
}
