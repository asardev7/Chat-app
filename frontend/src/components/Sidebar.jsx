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
    <aside className="h-full w-full flex flex-col bg-base-100 border-r border-base-300 overflow-hidden">
      <div className="shrink-0 px-4 py-4 border-b border-base-300 bg-base-100">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-base">Contacts</h2>
              <p className="text-xs text-base-content/50">
                {onlineUsers.filter((id) => users.some((u) => u._id === id)).length} online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-base-200/70 px-3 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Show online only</p>
            <p className="text-xs text-base-content/50">Filter active contacts</p>
          </div>

          <button
            type="button"
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              showOnlineOnly ? "bg-primary" : "bg-base-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                showOnlineOnly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          <div className="p-2">
            {filteredUsers.map((user) => {
              const isOnline = onlineUsers.includes(user._id);
              const isSelected = selectedUser?._id === user._id;

              return (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all mb-1
                    ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-base-200 border border-transparent"
                    }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-base-300"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-base-100 ${
                        isOnline ? "bg-green-500" : "bg-base-300"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{user.fullName}</p>
                    <p className={`text-sm ${isOnline ? "text-green-500" : "text-base-content/50"}`}>
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center px-6 text-center">
            <div>
              <p className="font-medium text-base-content/70">No contacts found</p>
              <p className="text-sm text-base-content/50 mt-1">
                Try turning off the online-only filter
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
