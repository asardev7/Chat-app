import { useLocation, useNavigate, Link } from "react-router-dom";
import { MessageSquare, Settings, LogOut as LogOutIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const Navbar = () => {
  const { authUser, logout } = useAuthStore();
  const { selectedUser } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (selectedUser) return null;

  const handleToggle = (path) => {
    if (location.pathname === path) {
      navigate("/");
    } else {
      navigate(path);
    }
  };

  return (
    <header className="bg-base-100/95 backdrop-blur-md border-b border-base-300 fixed top-0 left-0 right-0 z-40 h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg sm:text-xl tracking-tight">Ri-Chat</span>
            <span className="hidden sm:block text-[11px] text-base-content/50">
              Real-time messaging
            </span>
          </div>
        </Link>

        {authUser && (
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handleToggle("/settings")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all min-h-[42px]
                ${
                  location.pathname === "/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            <button
              onClick={() => handleToggle("/profile")}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 sm:px-3 py-2 text-sm font-medium transition-all min-h-[42px]
                ${
                  location.pathname === "/profile"
                    ? "bg-primary/10 text-primary"
                    : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
            >
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt="profile"
                className="w-8 h-8 rounded-full object-cover border border-base-300"
              />
              <span className="hidden md:inline max-w-28 truncate">
                {authUser.fullName?.split(" ")[0]}
              </span>
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-base-content/70 hover:bg-error/10 hover:text-error transition-all min-h-[42px]"
            >
              <LogOutIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
