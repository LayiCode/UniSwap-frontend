import { RequireAuth } from "@/components/RequireAuth";
import CreateListing from "@/components/CreateListing";

export const metadata = { title: "Sell an item" };

export default function NewListingPage() {
  return (
    <RequireAuth>
      <CreateListing />
    </RequireAuth>
  );
}
