import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Homepage = () => {
  const { selectedUser } = useChatStore();

  useEffect(() => {
    const setAppHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };

    setAppHeight();

    window.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("scroll", setAppHeight);

    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("scroll", setAppHeight);
    };
  }, []);

  return (
    <div
      className={`bg-base-200 overflow-hidden ${
        selectedUser
          ? "h-[var(--app-height)] md:h-screen"
          : "h-[calc(var(--app-height)-4rem)] md:h-[calc(100vh-4rem)] mt-16"
      }`}
    >
      <div className="flex h-full w-full min-h-0">
        <div
          className={`
            ${selectedUser ? "hidden md:flex" : "flex"}
            w-full md:w-80 lg:w-88 xl:w-96 flex-shrink-0 min-w-0 min-h-0
          `}
        >
          <Sidebar />
        </div>

        <div
          className={`
            ${!selectedUser ? "hidden md:flex" : "flex"}
            flex-1 min-w-0 min-h-0
          `}
        >
          {selectedUser ? <ChatContainer /> : <NoChatSelected />}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
