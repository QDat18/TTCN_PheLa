import type { Route } from "./+types/productDetail";
import ProductDetail from "~/pages/customer/product/ProductDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sản phẩm Phê La" },
    { name: "Sản phẩm", content: "Sản phẩm Phê La!" },
  ];
}

export default function HomePage() {
  return <ProductDetail />;
}
