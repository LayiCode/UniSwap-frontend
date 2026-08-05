import { RequireAuth } from "@/components/RequireAuth";
import ChatList from "@/components/ChatList";

export const metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <RequireAuth>
      <ChatList />
    </RequireAuth>
  );
}
