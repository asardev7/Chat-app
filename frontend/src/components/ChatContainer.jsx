import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Reply } from "lucide-react";

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
          className="underline underline-offset-2 break-all font-medium opacity-95"
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

const SWIPE_THRESHOLD = 60;

const SwipeableMessage = ({ children, onSwipe }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(true);
    setTriggered(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (deltaY > 20) {
      setSwipeX(0);
      return;
    }

    if (deltaX > 0 && deltaX <= SWIPE_THRESHOLD + 20) {
      setSwipeX(deltaX);
      if (deltaX >= SWIPE_THRESHOLD && !triggered) {
        setTriggered(true);
        if (navigator.vibrate) navigator.vibrate(30);
      }
    }
  };

  const handleTouchEnd = () => {
    if (triggered) onSwipe();
    setSwipeX(0);
    setSwiping(false);
    setTriggered(false);
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`transition-transform ${swiping ? "" : "duration-200"}`}
        style={{ transform: `translateX(${swipeX}px)` }}
      >
        {children}
      </div>

      {swipeX > 10 && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ opacity: Math.min(swipeX / SWIPE_THRESHOLD, 1) }}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              triggered ? "bg-primary text-primary-content scale-110" : "bg-base-300"
            } transition-all`}
          >
            <Reply className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setReplyTo,
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

  const handleReply = (message, isMine) => {
    setReplyTo({
      _id: message._id,
      text: message.text || null,
      image: message.image || null,
      senderName: isMine ? authUser.fullName : selectedUser.fullName,
    });
  };

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
              <p className="text-base font-medium text-base-content/70">No messages yet</p>
              <p className="text-sm text-base-content/50 mt-1">
                Start the conversation with {selectedUser?.fullName?.split(" ")[0]}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2 pb-2">
            {messages.map((message, index) => {
              const isMine =
                (message.senderid?._id || message.senderid)?.toString() ===
                authUser._id?.toString();

              const previousMessage = messages[index - 1];
              const previousIsSameSender =
                previousMessage &&
                (previousMessage.senderid?._id || previousMessage.senderid)?.toString() ===
                  (message.senderid?._id || message.senderid)?.toString();

              const hasReply =
                message.replyTo && message.replyTo.messageId;

              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                    previousIsSameSender ? "mt-0.5" : "mt-2.5"
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[88%] sm:max-w-[76%] lg:max-w-[62%] ${
                      isMine ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div className="shrink-0 self-end">
                      {!previousIsSameSender ? (
                        <img
                          src={
                            isMine
                              ? authUser.profilePic || "/avatar.png"
                              : selectedUser.profilePic || "/avatar.png"
                          }
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover border border-base-300"
                        />
                      ) : (
                        <div className="w-8 h-8" />
                      )}
                    </div>

                    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} w-full`}>
                      <SwipeableMessage onSwipe={() => handleReply(message, isMine)}>
                        <div
                          className={`rounded-2xl shadow-sm overflow-hidden ${
                            isMine
                              ? "bg-primary text-primary-content rounded-br-md"
                              : "bg-base-100 text-base-content rounded-bl-md border border-base-300/40"
                          }`}
                        >
                          {hasReply && (
                            <div
                              className={`mx-2 mt-2 rounded-xl px-3 py-2 text-[11px] border-l-4 ${
                                isMine
                                  ? "bg-primary-content/15 border-primary-content/50 text-primary-content/80"
                                  : "bg-base-200 border-primary text-base-content/70"
                              }`}
                            >
                              <p className="font-semibold text-[10px] mb-0.5 truncate">
                                {message.replyTo.senderName === authUser.fullName
                                  ? "You"
                                  : message.replyTo.senderName}
                              </p>

                              {message.replyTo.image && !message.replyTo.text && (
                                <div className="flex items-center gap-1">
                                  <img
                                    src={message.replyTo.image}
                                    alt="reply"
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                  <span className="truncate">📷 Photo</span>
                                </div>
                              )}

                              {message.replyTo.text && (
                                <p className="truncate">{message.replyTo.text}</p>
                              )}

                              {message.replyTo.image && message.replyTo.text && (
                                <div className="flex items-center gap-1">
                                  <img
                                    src={message.replyTo.image}
                                    alt="reply"
                                    className="w-6 h-6 rounded object-cover shrink-0"
                                  />
                                  <p className="truncate">{message.replyTo.text}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {message.image && (
                            <img
                              src={message.image}
                              alt="attachment"
                              className={`max-w-full max-h-72 object-cover ${
                                hasReply ? "mt-2 rounded-t-none" : ""
                              }`}
                            />
                          )}

                          {message.text && (
                            <div className={`${message.image ? "px-3 py-2.5" : "px-3 py-2"}`}>
                              <p className="text-[14px] sm:text-[14.5px] leading-[1.38] break-words whitespace-pre-wrap">
                                {linkifyText(message.text)}
                              </p>
                            </div>
                          )}

                          {!message.text && hasReply && <div className="pb-2" />}
                        </div>
                      </SwipeableMessage>

                      <div
                        className={`mt-0.5 px-1 flex items-center gap-1 text-[8px] sm:text-[9px] ${
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
