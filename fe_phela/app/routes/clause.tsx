import type { Route } from "./+types/clause";
import Clause from "~/pages/customer/membershipcard/Clause";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Điều khoản và điều lệ" },
    { name: "Thẻ thành viên", content: "Điều khoản và điều lệ tại Phê La!" },
  ];
}

export default function HomePage() {
  return <Clause />;
}
