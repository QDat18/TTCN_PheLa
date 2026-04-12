import type { Route } from "./+types/deliveryAddress";
import DeliveryAddress from "~/pages/customer/account/DeliveryAddress";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Địa chỉ giao hàng" },
    { name: "Địa chỉ", content: "Địa chỉ giao hàng của tôi!" },
  ];
}

export default function HomePage() {
  return <DeliveryAddress />;
}
