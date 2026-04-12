import type { Route } from "./+types/paymentReturn";
import PaymentReturn from "~/pages/customer/order/PaymentReturn";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kết quả đặt hàng" },
    { name: "Đặt hàng", content: "Phê La" },
  ];
}

export default function HomePage() {
  return <PaymentReturn />;
}
