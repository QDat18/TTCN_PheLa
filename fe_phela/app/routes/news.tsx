import type { Route } from "./+types/news";
import News from "~/pages/customer/news/News";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tin tức Phê La" },
    { name: "Tin tức", content: "Tin tức Phê La" },
  ];
}

export default function HomePage() {
  return <News />;
}
