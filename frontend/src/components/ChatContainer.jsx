import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser) return;
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-base-200">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <div className="shrink-0 border-t border-base-300 bg-base-100">
          <MessageInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-base-200">
      <div className="shrink-0">
        <ChatHeader />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-zinc-500 text-sm text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMine =
                (message.senderid?._id || message.senderid)?.toString() ===
                authUser._id?.toString();

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

                  <div
                    className={`chat-bubble flex flex-col gap-2 max-w-[75%] md:max-w-[60%] ${
                      isMine ? "chat-bubble-primary" : ""
                    }`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="attachment"
                        className="rounded-lg max-w-full max-h-60 object-cover"
                      />
                    )}
                    {message.text && (
                      <p className="text-sm leading-relaxed break-words">
                        {message.text}
                      </p>
                    )}
                  </div>

                  {isMine && (
                    <div className="chat-footer opacity-70 mt-0.5">
                      {message.seen ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-400 inline" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 sticky bottom-0 z-10 border-t border-base-300 bg-base-100">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
