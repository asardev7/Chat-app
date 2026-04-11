import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const nextWidth = e.clientX - rect.left;

      const minWidth = 280;
      const maxWidth = 460;

      if (nextWidth >= minWidth && nextWidth <= maxWidth) {
        setSidebarWidth(nextWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <div
      className={`bg-base-200 overflow-hidden ${
        selectedUser
          ? "h-dvh md:h-screen"
          : "mt-16 h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)]"
      }`}
    >
      <div ref={containerRef} className="flex h-full w-full min-h-0">
        <div
          className={`${selectedUser ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-shrink-0`}
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 768 ? `${sidebarWidth}px` : "100%",
          }}
        >
          <Sidebar />
        </div>

        {selectedUser && (
          <div
            className="hidden md:flex h-full w-[6px] cursor-col-resize items-center justify-center bg-base-200 hover:bg-base-300 transition-colors"
            onMouseDown={() => setIsDragging(true)}
          >
            <div className="h-12 w-[2px] rounded-full bg-base-300" />
          </div>
        )}

        <div
          className={`${!selectedUser ? "hidden md:flex" : "flex"} min-h-0 min-w-0 flex-1`}
        >
          {selectedUser ? <ChatContainer /> : <NoChatSelected />}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
