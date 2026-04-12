import type { Route } from "./+types/payment-cancel";
import PaymentCancel from "~/pages/customer/order/PaymentCancel";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hủy thanh toán" },
    { name: "Hủy đặt hàng", content: "Phê La" },
  ];
}

export default function PaymentCancelPage() {
  return <PaymentCancel />;
}
