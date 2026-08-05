import { RequireAuth } from "@/components/RequireAuth";
import EditListing from "@/components/EditListing";

export const metadata = { title: "Edit listing" };

export default async function EditListingPage(
  props: PageProps<"/products/[id]/edit">
) {
  const { id } = await props.params;
  return (
    <RequireAuth>
      <EditListing id={id} />
    </RequireAuth>
  );
}
