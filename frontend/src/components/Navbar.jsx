import { useLocation, useNavigate, Link } from "react-router-dom";
import { MessageSquare, Settings, User, LogOut as LogOutIcon } from "lucide-react";
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
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 h-16">
      <div className="h-full px-6 flex items-center justify-between">

        {/* LEFT — Logo */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Ri-Chat</span>
        </Link>

        {/* RIGHT — Nav actions */}
        {authUser && (
          <div className="flex items-center gap-1">

            <button
              onClick={() => handleToggle("/settings")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${location.pathname === "/settings"
                  ? "bg-primary/10 text-primary"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => handleToggle("/profile")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${location.pathname === "/profile"
                  ? "bg-primary/10 text-primary"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                }`}
            >
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt="profile"
                className="w-6 h-6 rounded-full object-cover border border-base-300"
              />
              <span className="hidden sm:inline">{authUser.fullName?.split(" ")[0]}</span>
            </button>

            <div className="w-px h-6 bg-base-300 mx-1" />

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:bg-error/10 hover:text-error transition-all"
            >
              <LogOutIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
