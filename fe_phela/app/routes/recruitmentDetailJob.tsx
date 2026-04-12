import type { Route } from "./+types/recruitmentDetailJob";
import RecruitmentDetailJob from "~/pages/admin/recruitment/RecruitmentDetailJob";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chi tiết tin tuyển dụng" },
    { name: "Tuyển dụng", content: "Phê La!" },
  ];
}

export default function HomePage() {
  return <RecruitmentDetailJob />;
}
