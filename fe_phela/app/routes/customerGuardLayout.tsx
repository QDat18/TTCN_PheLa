import { Outlet } from "react-router";
import CustomerGuard from "~/components/common/CustomerGuard";

export default function CustomerGuardLayout() {
  return (
    <CustomerGuard>
      <Outlet />
    </CustomerGuard>
  );
}
