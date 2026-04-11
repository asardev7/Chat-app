import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";

const linkifyText = (text) => {
  if (!text) return null;

  const urlRegex = /((https?:\/\/|www\.)[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    const isUrl = /^(https?:\/\/|www\.)/i.test(part);

    if (isUrl) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 break-all font-medium"
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

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
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 h-full bg-base-200">
        <div className="shrink-0">
          <ChatHeader />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <MessageSkeleton />
        </div>

        <div className="shrink-0 border-t border-base-300 bg-base-100">
          <MessageInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-base-200">
      <div className="shrink-0">
        <ChatHeader />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-6">
            <div>
              <p className="text-base font-medium text-base-content/70">
                No messages yet
              </p>
              <p className="text-sm text-base-content/50 mt-1">
                Start the conversation with {selectedUser?.fullName?.split(" ")[0]}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5 pb-2">
            {messages.map((message, index) => {
              const isMine =
                (message.senderid?._id || message.senderid)?.toString() ===
                authUser._id?.toString();

              const previousMessage = messages[index - 1];
              const previousIsSameSender =
                previousMessage &&
                (previousMessage.senderid?._id || previousMessage.senderid)?.toString() ===
                  (message.senderid?._id || message.senderid)?.toString();

              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                    previousIsSameSender ? "mt-1" : "mt-3"
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[88%] sm:max-w-[78%] lg:max-w-[64%] ${
                      isMine ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className="shrink-0 self-end">
                      {!isMine && !previousIsSameSender ? (
                        <img
                          src={selectedUser.profilePic || "/avatar.png"}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover border border-base-300"
                        />
                      ) : isMine && !previousIsSameSender ? (
                        <img
                          src={authUser.profilePic || "/avatar.png"}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover border border-base-300"
                        />
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>

                    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                          isMine
                            ? "bg-primary text-primary-content rounded-br-md"
                            : "bg-base-100 text-base-content rounded-bl-md border border-base-300/40"
                        }`}
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt="attachment"
                            className="rounded-xl mb-2 max-w-full max-h-72 object-cover"
                          />
                        )}

                        {message.text && (
                          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {linkifyText(message.text)}
                          </p>
                        )}
                      </div>

                      <div
                        className={`mt-1 px-1 flex items-center gap-1 text-[9px] sm:text-[10px] ${
                          isMine
                            ? "justify-end text-base-content/45"
                            : "justify-start text-base-content/40"
                        }`}
                      >
                        <span>{formatMessageTime(message.createdAt)}</span>

                        {isMine &&
                          (message.seen ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-base-300 bg-base-100">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
