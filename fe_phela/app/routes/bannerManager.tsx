import type { Route } from "./+types/bannerManager";
import BannerManager from "~/pages/admin/anotherManager/BannerManager";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý Banner" },
    { name: "Banner", content: "Chào mừng đến Phê La!" },
  ];
}

export default function HomePage() {
  return <BannerManager />;
}
