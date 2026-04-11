import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full flex flex-col bg-base-100 border-r border-base-300">
      {/* Header */}
      <div className="px-4 py-4 border-b border-base-300">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary" />
          <span className="font-semibold text-base">Contacts</span>
          <span className="ml-auto text-xs text-zinc-500">
            {onlineUsers.length - 1} online
          </span>
        </div>

        {/* Online filter toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <div
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
              showOnlineOnly ? "bg-primary" : "bg-base-300"
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              showOnlineOnly ? "translate-x-5" : "translate-x-0"
            }`} />
          </div>
          <span className="text-xs text-zinc-500">Show online only</span>
        </label>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full flex items-center gap-3 px-4 py-3
              hover:bg-base-200 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-200 ring-1 ring-inset ring-base-300" : ""}
            `}
          >
            <div className="relative flex-shrink-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="font-medium text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-zinc-500">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </p>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No online users
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
