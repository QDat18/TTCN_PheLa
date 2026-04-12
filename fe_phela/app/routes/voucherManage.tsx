import type { Route } from "./+types/voucherManage";
import VoucherManager from "~/pages/admin/salesManage/Voucher";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quản lý Khuyến mãi - Phê La" },
    { name: "description", content: "Quản lý mã giảm giá" },
  ];
}

export default function VoucherPage() {
  return <VoucherManager />;
}
