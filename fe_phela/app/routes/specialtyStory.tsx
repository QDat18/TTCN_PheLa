import type { Route } from "./+types/specialtyStory";
import SpecialtyStory from "~/pages/customer/specialtystory/SpecialtyStory";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nốt hương đặc sản" },
    { name: "Nốt hương đặc sản", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <SpecialtyStory />;
}
