import type { Route } from "./+types/loginRegisterAdmin";
import LoginRegister from "~/pages/admin/account/LoginRegisterAdmin";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đăng nhập tài khoản" },
    { name: "Đăng nhập", content: "Kết nối Phê La nào!" },
  ];
}

export default function HomePage() {
  return <LoginRegister />;
}
