import type { Route } from "./+types/olongPearl";
import OlongPearl from "~/pages/customer/brandstory/OlongPearl";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trân châu Ô Long" },
    { name: "Ô long", content: "Trân châu Ô Long" },
  ];
}

export default function HomePage() {
  return <OlongPearl />;
}
