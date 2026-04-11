import { Link } from "react-router-dom";
import { MessageSquare, Settings, User, LogOut as LogOutIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const Navbar = () => {
  const { authUser, logout } = useAuthStore();
  const { selectedUser } = useChatStore();

  if (selectedUser) return null;

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 h-16">
      <div className="max-w-screen-xl mx-auto px-4 h-full flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-bold text-lg">Ri-Chat</h1>
        </Link>

        {authUser && (
          <div className="flex items-center gap-1">
            <Link to="/settings" className="btn btn-ghost btn-sm gap-1.5">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Settings</span>
            </Link>
            <Link to="/profile" className="btn btn-ghost btn-sm gap-1.5">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Profile</span>
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm gap-1.5">
              <LogOutIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
