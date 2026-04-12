import type { Route } from "./+types/product";
import Product from "~/pages/customer/product/Product";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sản phẩm Phê La" },
    { name: "Sản phẩm", content: "Sản phẩm Phê La!" },
  ];
}

export default function HomePage() {
  return <Product />;
}
