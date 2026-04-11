import { useChatStore } from "../store/useChatStore";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, CornerUpLeft } from "lucide-react";

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

const SWIPE_THRESHOLD = 64;

const SwipeableMessage = ({ children, onSwipe, enabled }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [swipeX, setSwipeX] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const handleTouchStart = (e) => {
    if (!enabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsTracking(true);
    setIsTriggered(false);
  };

  const handleTouchMove = (e) => {
    if (!enabled || touchStartX.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (deltaY > 24) {
      setSwipeX(0);
      return;
    }

    if (deltaX > 0) {
      const clampedX = Math.min(deltaX, SWIPE_THRESHOLD + 18);
      setSwipeX(clampedX);

      if (clampedX >= SWIPE_THRESHOLD && !isTriggered) {
        setIsTriggered(true);
        if (navigator.vibrate) navigator.vibrate(25);
      }

      if (clampedX < SWIPE_THRESHOLD && isTriggered) {
        setIsTriggered(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!enabled) return;

    if (isTriggered) onSwipe();

    setSwipeX(0);
    setIsTracking(false);
    setIsTriggered(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {enabled && swipeX > 8 && (
        <div
          className="pointer-events-none absolute left-0 top-1/2 z-0 -translate-y-1/2"
          style={{ opacity: Math.min(swipeX / SWIPE_THRESHOLD, 1) }}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              isTriggered
                ? "scale-110 bg-primary text-primary-content shadow-md"
                : "bg-base-300 text-base-content/65"
            }`}
          >
            <CornerUpLeft className="h-4 w-4" />
          </div>
        </div>
      )}

      <div
        className={`relative z-[1] transition-transform ${
          isTracking ? "duration-75" : "duration-200"
        }`}
        style={{ transform: `translateX(${enabled ? swipeX : 0}px)` }}
      >
        {children}
      </div>
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
  const scrollContainerRef = useRef(null);
  const messageRefs = useRef({});
  const [isDesktop, setIsDesktop] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  useEffect(() => {
    const updateLayoutMode = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);

    return () => window.removeEventListener("resize", updateLayoutMode);
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!messageEndRef.current) return;
    messageEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const normalizedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const currentSenderId = (message.senderid?._id || message.senderid)?.toString();
      const prev = messages[index - 1];
      const next = messages[index + 1];

      const prevSenderId = (prev?.senderid?._id || prev?.senderid)?.toString();
      const nextSenderId = (next?.senderid?._id || next?.senderid)?.toString();

      const isMine = currentSenderId === authUser._id?.toString();
      const startsGroup = prevSenderId !== currentSenderId;
      const endsGroup = nextSenderId !== currentSenderId;

      return {
        ...message,
        isMine,
        startsGroup,
        endsGroup,
      };
    });
  }, [messages, authUser]);

  const handleReply = (message, isMine) => {
    setReplyTo({
      _id: message._id,
      text: message.text || null,
      image: message.image || null,
      senderName: isMine ? authUser.fullName : selectedUser.fullName,
    });
  };

  const handleJumpToOriginal = (replyMessageId) => {
    if (!replyMessageId) return;

    const targetNode = messageRefs.current[replyMessageId];
    if (!targetNode) return;

    targetNode.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    setHighlightedMessageId(replyMessageId);
    window.clearTimeout(handleJumpToOriginal._timeout);

    handleJumpToOriginal._timeout = window.setTimeout(() => {
      setHighlightedMessageId(null);
    }, 1800);
  };

  const getBubbleShape = (message) => {
    if (message.isMine) {
      if (message.endsGroup) {
        return "rounded-2xl rounded-br-md";
      }
      return "rounded-2xl rounded-br-lg";
    }

    if (message.endsGroup) {
      return "rounded-2xl rounded-bl-md";
    }

    return "rounded-2xl rounded-bl-lg";
  };

  const getBubbleTail = (message) => {
    if (!message.endsGroup) return null;

    if (message.isMine) {
      return (
        <span className="pointer-events-none absolute -bottom-[1px] -right-[6px] h-4 w-4 overflow-hidden">
          <span className="absolute bottom-0 right-[3px] h-4 w-4 rounded-bl-[14px] bg-primary" />
          <span className="absolute bottom-[-1px] right-[9px] h-4 w-4 rounded-bl-[14px] bg-base-200" />
        </span>
      );
    }

    return (
      <span className="pointer-events-none absolute -bottom-[1px] -left-[6px] h-4 w-4 overflow-hidden">
        <span className="absolute bottom-0 left-[3px] h-4 w-4 rounded-br-[14px] border border-base-300/40 bg-base-100" />
        <span className="absolute bottom-[-1px] left-[9px] h-4 w-4 rounded-br-[14px] bg-base-200" />
      </span>
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-base-200">
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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-base-200">
      <div className="shrink-0">
        <ChatHeader />
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 py-3 sm:px-4"
      >
        {normalizedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-5 text-center">
            <div>
              <p className="text-base font-medium text-base-content/70">No messages yet</p>
              <p className="mt-1 text-sm text-base-content/50">
                Start the conversation with {selectedUser?.fullName?.split(" ")[0]}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pb-2">
            {normalizedMessages.map((message) => {
              const hasReply = !!message.replyTo?.messageId;
              const isHighlighted = highlightedMessageId === message._id;

              const bubbleContent = (
                <div
                  ref={(node) => {
                    if (node) messageRefs.current[message._id] = node;
                  }}
                  className={`group/message relative flex w-full max-w-full flex-col ${
                    message.isMine ? "items-end" : "items-start"
                  } ${isHighlighted ? "z-10" : ""}`}
                >
                  {isDesktop && (
                    <button
                      type="button"
                      onClick={() => handleReply(message, message.isMine)}
                      aria-label="Reply to message"
                      className={`absolute top-1 z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-base-300 bg-base-100/96 text-base-content/55 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out hover:scale-[1.04] hover:text-primary md:flex ${
                        message.isMine ? "-left-10" : "-right-10"
                      } opacity-0 translate-y-1 pointer-events-none group-hover/message:translate-y-0 group-hover/message:opacity-100 group-hover/message:pointer-events-auto`}
                    >
                      <CornerUpLeft className="h-4 w-4" />
                    </button>
                  )}

                  <div
                    className={`relative transition-all duration-300 ease-out ${
                      isHighlighted
                        ? "scale-[1.01] ring-2 ring-primary/30 shadow-md"
                        : "ring-0"
                    } ${getBubbleShape(message)} ${
                      message.isMine
                        ? "bg-primary text-primary-content"
                        : "border border-base-300/40 bg-base-100 text-base-content"
                    } overflow-visible shadow-sm max-w-full`}
                  >
                    {getBubbleTail(message)}

                    {hasReply && (
                      <button
                        type="button"
                        onClick={() => handleJumpToOriginal(message.replyTo.messageId)}
                        className={`mx-2 mt-2 block w-[calc(100%-1rem)] rounded-xl border-l-4 px-2 py-1.5 text-left text-[11px] transition-colors duration-200 ${
                          message.isMine
                            ? "border-primary-content/50 bg-primary-content/15 text-primary-content/85 hover:bg-primary-content/20"
                            : "border-primary bg-base-200 text-base-content/72 hover:bg-base-300/70"
                        }`}
                      >
                        <p className="mb-0.5 truncate text-[10px] font-semibold">
                          {message.replyTo.senderName === authUser.fullName
                            ? "You"
                            : message.replyTo.senderName}
                        </p>

                        {message.replyTo.image && !message.replyTo.text && (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={message.replyTo.image}
                              alt="reply preview"
                              className="h-8 w-8 rounded-md object-cover"
                            />
                            <span className="truncate">📷 Photo</span>
                          </div>
                        )}

                        {message.replyTo.text && !message.replyTo.image && (
                          <p className="truncate">{message.replyTo.text}</p>
                        )}

                        {message.replyTo.image && message.replyTo.text && (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={message.replyTo.image}
                              alt="reply preview"
                              className="h-6 w-6 shrink-0 rounded object-cover"
                            />
                            <p className="truncate">{message.replyTo.text}</p>
                          </div>
                        )}
                      </button>
                    )}

                    {message.image && (
                      <img
                        src={message.image}
                        alt="attachment"
                        className={`max-h-72 w-auto max-w-full object-cover ${
                          hasReply ? "mt-2 rounded-xl" : "rounded-2xl"
                        }`}
                      />
                    )}

                    {message.text && (
                      <div className={message.image ? "px-2.5 py-2" : "px-2.5 py-1.5"}>
                        <p className="break-words whitespace-pre-wrap text-[14px] leading-[1.32] sm:text-[14.5px]">
                          {linkifyText(message.text)}
                        </p>
                      </div>
                    )}

                    {!message.text && hasReply && <div className="pb-2" />}
                  </div>

                  <div
                    className={`mt-0.5 flex items-center gap-1 px-1 text-[10px] ${
                      message.isMine
                        ? "justify-end text-base-content/45"
                        : "justify-start text-base-content/40"
                    }`}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>

                    {message.isMine &&
                      (message.seen ? (
                        <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      ))}
                  </div>
                </div>
              );

              return (
                <div
                  key={message._id}
                  className={`flex w-full ${message.isMine ? "justify-end" : "justify-start"} ${
                    message.startsGroup ? "mt-2.5" : "mt-0.5"
                  }`}
                >
                  <div
                    className={`flex w-full items-end gap-2 ${
                      message.isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!message.isMine && (
                      <div className="w-8 shrink-0 self-end">
                        {message.endsGroup ? (
                          <img
                            src={selectedUser?.profilePic || "/avatar.png"}
                            alt="avatar"
                            className="h-8 w-8 rounded-full border border-base-300 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 max-w-[82%] sm:max-w-[72%] lg:max-w-[58%]">
                      {isDesktop ? (
                        bubbleContent
                      ) : (
                        <SwipeableMessage
                          onSwipe={() => handleReply(message, message.isMine)}
                          enabled={!isDesktop}
                        >
                          {bubbleContent}
                        </SwipeableMessage>
                      )}
                    </div>

                    {message.isMine && (
                      <div className="w-8 shrink-0 self-end">
                        {message.endsGroup ? (
                          <img
                            src={authUser?.profilePic || "/avatar.png"}
                            alt="avatar"
                            className="h-8 w-8 rounded-full border border-base-300 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8" />
                        )}
                      </div>
                    )}
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
