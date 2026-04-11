import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Homepage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className={`
          ${selectedUser ? "hidden md:flex" : "flex"}
          w-full md:w-72 lg:w-80 flex-shrink-0
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
    </div>
  );
};

export default Homepage;
