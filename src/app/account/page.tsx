import { RequireAuth } from "@/components/RequireAuth";
import AccountForm from "@/components/AccountForm";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountForm />
    </RequireAuth>
  );
}
