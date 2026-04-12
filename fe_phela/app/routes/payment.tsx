import type { Route } from "./+types/payment";
import Payment from "~/pages/customer/order/Payment";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hãy đặt hàng!!!" },
    { name: "Đặt hàng", content: "Phê La" },
  ];
}

export default function HomePage() {
  return <Payment />;
}
