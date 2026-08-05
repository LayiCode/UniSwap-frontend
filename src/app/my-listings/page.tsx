import { RequireAuth } from "@/components/RequireAuth";
import MyListings from "@/components/MyListings";

export const metadata = { title: "My Listings" };

export default function MyListingsPage() {
  return (
    <RequireAuth>
      <MyListings />
    </RequireAuth>
  );
}
