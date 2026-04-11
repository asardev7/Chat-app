import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Homepage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div
      className={`bg-base-200 overflow-hidden ${
        selectedUser
          ? "h-dvh md:h-screen"
          : "mt-16 h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)]"
      }`}
    >
      <div className="flex h-full w-full min-h-0">
        <div
          className={`
            ${selectedUser ? "hidden md:flex" : "flex"}
            w-full min-h-0 min-w-0 flex-shrink-0 md:w-80 lg:w-88 xl:w-96
          `}
        >
          <Sidebar />
        </div>

        <div
          className={`
            ${!selectedUser ? "hidden md:flex" : "flex"}
            min-h-0 min-w-0 flex-1
          `}
        >
          {selectedUser ? <ChatContainer /> : <NoChatSelected />}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
