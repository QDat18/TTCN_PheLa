import type { Route } from "./+types/storePage";
import Store from "~/pages/customer/store/Store";
export function meta({}: Route.MetaArgs) {
    return [
      { title: "Cửa hàng Phê La" },
      { name: "Cửa hàng", content: "Tìm hiểu cửa hàng Phê La!" },
    ];
  }
  
  export default function HomePage() {
    return <Store />;
  }