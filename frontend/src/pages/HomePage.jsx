import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Homepage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-[calc(100vh-4rem)] bg-base-200 flex overflow-hidden mt-16">
      <div className={`
        ${selectedUser ? "hidden md:flex" : "flex"}
        w-full md:w-72 lg:w-80 flex-shrink-0 flex-col
      `}>
        <Sidebar />
      </div>

      <div className={`
        ${!selectedUser ? "hidden md:flex" : "flex"}
        flex-1 flex-col min-w-0
      `}>
        {selectedUser ? <ChatContainer /> : <NoChatSelected />}
      </div>
    </div>
  );
};

export default Homepage;
