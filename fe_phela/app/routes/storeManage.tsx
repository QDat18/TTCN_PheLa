import type { Route } from "./+types/storeManage";
import Store from "~/pages/admin/Store";
export function meta({}: Route.MetaArgs) {
    return [
      { title: "Cửa hàng Phê La" },
      { name: "Cửa hàng", content: "Quản lý cửa hàng Phê La!" },
    ];
  }
  
  export default function HomePage() {
    return <Store />;
  }