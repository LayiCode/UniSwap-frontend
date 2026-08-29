import { RequireAuth } from "@/components/RequireAuth";
import UserProfile from "@/components/UserProfile";

export const metadata = { title: "Profile" };

export default async function UserProfilePage(
  props: PageProps<"/users/[id]">
) {
  const { id } = await props.params;
  return (
    <RequireAuth>
      <UserProfile id={id} />
    </RequireAuth>
  );
}
