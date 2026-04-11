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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              className={`chat ${isMine ? "chat-end" : "chat-start"}`}
            >
              
              <div className="chat-image avatar">
                <div className="w-9 rounded-full border border-base-300">
                  <img
                    src={
                      isMine
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="avatar"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className={`chat-bubble flex flex-col gap-2 max-w-[75%] md:max-w-[60%] ${
                isMine ? "chat-bubble-primary" : ""
              }`}>
                {message.image && (
                  <img
                    src={message.image}
                    alt="attachment"
                    className="rounded-lg max-w-full max-h-60 object-cover"
                  />
                )}
                {message.text && (
                  <p className="text-sm leading-relaxed break-words">{message.text}</p>
                )}
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
