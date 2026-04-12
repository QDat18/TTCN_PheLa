import type { Route } from "./+types/profileAdmin";
import ProfileAdmin from "~/pages/admin/account/ProfileAdmin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý tài khoản" },
    { name: "Tài khoản", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <ProfileAdmin />;
}
