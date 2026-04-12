import type { Route } from "./+types/myOrders";
import MyOrders from "~/pages/customer/order/MyOrders";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đơn hàng của tôi" },
    { name: "Đơn hàng", content: "Đơn hàng của tôi!" },
  ];
}

export default function HomePage() {
  return <MyOrders />;
}
