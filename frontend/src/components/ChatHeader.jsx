import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="px-3 py-3 border-b border-base-300 bg-base-100 flex items-center gap-3">

      <button
        onClick={() => setSelectedUser(null)}
        className="md:hidden btn btn-ghost btn-sm btn-circle"
        aria-label="Back to contacts"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="relative flex-shrink-0">
        <img
          src={selectedUser.profilePic || "/avatar.png"}
          alt={selectedUser.fullName}
          className="w-10 h-10 rounded-full object-cover"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">{selectedUser.fullName}</h3>
        <p className={`text-xs ${isOnline ? "text-green-500" : "text-zinc-500"}`}>
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      <button
        onClick={() => setSelectedUser(null)}
        className="hidden md:flex btn btn-ghost btn-sm btn-circle"
        aria-label="Close chat"
      >
        ✕
      </button>
    </div>
  );
};

export default ChatHeader;
