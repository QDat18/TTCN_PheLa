import type { Route } from "./+types/productManage";
import ProductManage from "~/pages/admin/productManage/ProductManage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sản phẩm Phê La" },
    { name: "Sản phẩm", content: "Sản phẩm Phê La!" },
  ];
}

export default function HomePage() {
  return <ProductManage />;
}
