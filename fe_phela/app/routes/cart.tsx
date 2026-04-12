import type { Route } from "./+types/cart";
import Cart from "~/pages/customer/order/Cart";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Giỏ hàng của bạn" },
    { name: "Giỏ hàng", content: "Phê La" },
  ];
}

export default function HomePage() {
  return <Cart />;
}
