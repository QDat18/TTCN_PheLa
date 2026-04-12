import type { Route } from "./+types/news";
import NewDetail from "~/pages/customer/news/NewDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chi tiết tin tức Phê La" },
    { name: "Tin tức", content: "Tin tức Phê La" },
  ];
}

export default function HomePage() {
  return <NewDetail />;
}
