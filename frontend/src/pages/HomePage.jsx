import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Homepage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div
      className={`bg-base-200 overflow-hidden ${
        selectedUser ? "h-screen" : "h-[calc(100vh-4rem)] mt-16"
      }`}
    >
      <div className="flex h-full w-full">
        <div
          className={`
            ${selectedUser ? "hidden md:flex" : "flex"}
            w-full md:w-80 lg:w-88 xl:w-96 flex-shrink-0 min-w-0
          `}
        >
          <Sidebar />
        </div>

        <div
          className={`
            ${!selectedUser ? "hidden md:flex" : "flex"}
            flex-1 min-w-0
          `}
        >
          {selectedUser ? <ChatContainer /> : <NoChatSelected />}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
