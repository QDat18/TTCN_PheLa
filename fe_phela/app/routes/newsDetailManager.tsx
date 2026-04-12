import type { Route } from "./+types/newsDetailManager";
import NewsDetailManager from "~/pages/admin/anotherManager/NewsDetailManager";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý tin tức" },
    { name: "Tin tức", content: "Tin tức Phê La" },
  ];
}

export default function HomePage() {
  return <NewsDetailManager />;
}
