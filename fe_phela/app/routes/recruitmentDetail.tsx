import type { Route } from "./+types/recruitmentDetail";
import RecruitmentDetail from "~/pages/customer/recruitment/RecruitmentDetail";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chi tiết tin tuyển dụng" },
    { name: "Tuyển dụng", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <RecruitmentDetail />;
}
