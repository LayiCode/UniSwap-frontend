import { RequireAuth } from "@/components/RequireAuth";
import ChatThread from "@/components/ChatThread";

export const metadata = { title: "Chat" };

export default function ChatPage() {
  return (
    <RequireAuth>
      <ChatThread />
    </RequireAuth>
  );
}
