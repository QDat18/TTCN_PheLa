import type { Route } from "./+types/category";
import Category from "~/pages/admin/productManage/Category";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Danh mục sản phẩm" },
    { name: "Danh mục", content: "Danh mục sản phẩm!" },
  ];
}

export default function HomePage() {
  return <Category />;
}
