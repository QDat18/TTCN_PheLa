import type { Route } from "./+types/profileCustomer";
import ProfileCustomer from "~/pages/customer/account/ProfileCustomer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý tài khoản" },
    { name: "Tài khoản", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <ProfileCustomer />;
}
