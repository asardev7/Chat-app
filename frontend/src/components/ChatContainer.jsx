import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;
    getMessages(selectedUser._id);
    const { subscribeToMessages, unsubscribeFromMessages } = useChatStore.getState();
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >

              <img
                src={isMine
                  ? authUser.profilePic || "/avatar.png"
                  : selectedUser.profilePic || "/avatar.png"
                }
                alt="avatar"
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
              />


              <div className={`max-w-[70%] md:max-w-[60%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                {message.image && (
                  <img
                    src={message.image}
                    alt="attachment"
                    className="rounded-xl max-w-full max-h-60 object-cover border border-base-300"
                  />
                )}
                {message.text && (
                  <div className={`
                    px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
                    ${isMine
                      ? "bg-primary text-primary-content rounded-br-sm"
                      : "bg-base-200 text-base-content rounded-bl-sm"
                    }
                  `}>
                    {message.text}
                  </div>
                )}
                <span className="text-[10px] text-zinc-400 px-1">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
