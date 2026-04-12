import type { Route } from "./+types/candidate";
import Candidate from "~/pages/admin/recruitment/Candidate";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý ứng viên" },
    { name: "Tuyển dụng", content: "Phê La tuyển dụng!" },
  ];
}

export default function HomePage() {
  return <Candidate />;
}
