import type { Route } from "./+types/support";
import Support from "~/pages/admin/Support";
export function meta({}: Route.MetaArgs) {
    return [
      { title: "Chat với khách hàng" },
      { name: "Chatbox", content: "Phê La chatbox!" },
    ];
  }
  
  export default function HomePage() {
    return <Support />;
  }