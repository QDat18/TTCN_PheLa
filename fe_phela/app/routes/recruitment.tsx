import type { Route } from "./+types/recruitment";
import Recruitment from "~/pages/admin/recruitment/Recruitment";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý tin tuyển dụng | Phê La " },
    { name: "Tuyển dụng", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <Recruitment />;
}
