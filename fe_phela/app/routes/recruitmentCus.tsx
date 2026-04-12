import type { Route } from "./+types/recruitmentCus";
import Recruitment from "~/pages/customer/recruitment/Recruitment";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tuyển dụng Phê La" },
    { name: "Tuyển dụng", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <Recruitment />;
}
