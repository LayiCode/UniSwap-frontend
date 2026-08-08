import { RequireAuth } from "@/components/RequireAuth";
import PurchaseRequests from "@/components/PurchaseRequests";

export const metadata = { title: "Purchases" };

export default function PurchasesPage() {
  return (
    <RequireAuth>
      <PurchaseRequests />
    </RequireAuth>
  );
}
