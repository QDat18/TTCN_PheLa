import type { Route } from "./+types/contact";
import Contact from "~/pages/customer/contact/Contact";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Liên hệ Phê La" },
    { name: "Liên hệ", content: "Liên hệ đến chúng tôi!" },
  ];
}

export default function HomePage() {
  return <Contact />;
}
