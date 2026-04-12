import type { Route } from "./+types/differentStyle";
import DifferentStyle from "~/pages/customer/brandstory/DifferentStyle";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Phong cách khác biệt" },
    { name: "Phong cách", content: "Phong cách Phê La!" },
  ];
}

export default function HomePage() {
  return <DifferentStyle />;
}
