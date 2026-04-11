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
    <aside className="h-full w-full md:w-80 border-r border-base-300 bg-base-100 flex flex-col">
      
      {/* Premium header */}
      <div className="border-b border-base-300 w-full p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-semibold text-lg">Contacts</span>
          </div>
        </div>

        {/* Premium toggle button */}
        <div className="mt-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-base-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-base-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ms-3 text-sm font-medium text-base-content">
              Show online only ({Math.max(onlineUsers.length - 1, 0)})
            </span>
          </label>
        </div>
      </div>

      {/* Clean contact list */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => {
          const unread = unreadCounts?.[user._id] || 0;
          const isSelected = selectedUser?._id === user._id;
          const isOnline = onlineUsers.includes(user._id);

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
                isSelected 
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 border-r-2 border-primary shadow-sm" 
                  : "hover:bg-base-200/50"
              }`}
            >
              {/* Premium avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full ring-1 ring-base-300/50"
                />
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-base-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-base truncate">{user.fullName}</h3>
                  {unread > 0 && (
                    <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center">
                      {unread > 99 ? "99+" : unread}
                    </div>
                  )}
                </div>
                <p className={`text-sm ${isOnline ? "text-green-500 font-medium" : "text-zinc-500"}`}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-base-200 rounded-2xl flex items-center justify-center mb-4">
              <Users className="size-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No contacts</h3>
            <p className="text-zinc-500">Enable "Show online only" to see active users</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
