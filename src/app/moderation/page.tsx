import { RequireAuth } from "@/components/RequireAuth";
import Moderation from "@/components/Moderation";

export const metadata = { title: "Moderation" };

export default function ModerationPage() {
  return (
    <RequireAuth>
      <Moderation />
    </RequireAuth>
  );
}
