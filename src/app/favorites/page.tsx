import { RequireAuth } from "@/components/RequireAuth";
import Favorites from "@/components/Favorites";

export const metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <Favorites />
    </RequireAuth>
  );
}
