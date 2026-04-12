import type { Route } from "./+types/staff";
import Staff from "~/pages/admin/Staff";
export function meta({}: Route.MetaArgs) {
    return [
      { title: "Quản lý nhân viên" },
      { name: "Nhân viên", content: "Quản lý nhân viên Phê La!" },
    ];
  }
  
  export default function HomePage() {
    return <Staff />;
  }