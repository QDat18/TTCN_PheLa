import type { Route } from "./+types/newsManager";
import NewsManager from "~/pages/admin/anotherManager/NewsManager";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý tin tức" },
    { name: "Tin tức", content: "Tin tức Phê La" },
  ];
}

export default function HomePage() {
  return <NewsManager />;
}
