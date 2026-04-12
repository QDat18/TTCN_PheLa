import type { Route } from "./+types/aboutUs";
import AboutUs from "~/pages/customer/brandstory/AboutUs";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Thương hiệu Phê La" },
    { name: "Thương hiệu", content: "Thương hiệu Phê La!" },
  ];
}

export default function HomePage() {
  return <AboutUs />;
}
