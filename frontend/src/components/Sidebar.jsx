import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
  } = useChatStore();

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
    <aside className="h-full w-full md:w-[320px] lg:w-[340px] border-r border-base-300 bg-base-100 flex flex-col">
      <div className="border-b border-base-300 px-4 py-4 md:px-5 md:py-5">
        <div className="flex items-center gap-2">
          <Users className="size-5 md:size-6 text-base-content" />
          <span className="text-base md:text-lg font-semibold text-base-content">
            Contacts
          </span>
        </div>

        <div className="mt-4 flex items-center">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-base-300 transition-colors duration-300 peer-checked:bg-primary/80" />
              <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 peer-checked:translate-x-5" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content">Show online only</span>
              <span className="text-xs text-zinc-500">
                ({Math.max(onlineUsers.length - 1, 0)} online)
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {filteredUsers.map((user) => {
          const unread = unreadCounts?.[user._id] || 0;
          const isSelected = selectedUser?._id === user._id;
          const isOnline = onlineUsers.includes(user._id);

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 ${
                isSelected
                  ? "bg-base-200/90 border-r-2 border-primary"
                  : "hover:bg-base-200/50"
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName || user.name}
                  className="size-12 rounded-full object-cover border border-base-300"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-green-500 ring-2 ring-base-100" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-base-content">
                  {user.fullName || user.name}
                </p>
                <p
                  className={`mt-0.5 text-sm ${
                    isOnline ? "text-green-500" : "text-zinc-400"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>

              {unread > 0 && (
                <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </div>
              )}
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            No online users
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
