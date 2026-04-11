import { useChatStore } from "../store/useChatStore";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import {
  Check,
  CheckCheck,
  CornerUpLeft,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const SWIPE_THRESHOLD = 60;
const LONG_PRESS_MS = 450;

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
          className="break-all font-medium underline underline-offset-2 opacity-95"
        >
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
};

const SwipeableMessage = ({ children, onSwipe, onLongPress, disabled }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const longPressTimeout = useRef(null);

  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [longPressed, setLongPressed] = useState(false);

  const clearLongPress = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const reset = () => {
    setSwipeX(0);
    setSwiping(false);
    setTriggered(false);
    setLongPressed(false);
    touchStartX.current = null;
    touchStartY.current = null;
    clearLongPress();
  };

  const handleTouchStart = (e) => {
    if (disabled) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(true);
    setTriggered(false);
    setLongPressed(false);

    clearLongPress();
    longPressTimeout.current = setTimeout(() => {
      setLongPressed(true);
      if (navigator.vibrate) navigator.vibrate(30);
      onLongPress?.();
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e) => {
    if (disabled || touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (deltaY > 12 || Math.abs(deltaX) > 10) {
      clearLongPress();
    }

    if (deltaY > 24 || longPressed) {
      setSwipeX(0);
      return;
    }

    if (deltaX > 0) {
      const nextX = Math.min(deltaX, SWIPE_THRESHOLD + 18);
      setSwipeX(nextX);

      if (nextX >= SWIPE_THRESHOLD && !triggered) {
        setTriggered(true);
        if (navigator.vibrate) navigator.vibrate(20);
      }
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    clearLongPress();

    if (!longPressed && triggered) {
      onSwipe?.();
    }

    reset();
  };

  return (
    <div
      className="relative w-full touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={reset}
    >
      <div
        className={`transition-transform ${swiping ? "duration-75" : "duration-200"} ease-out`}
        style={{ transform: `translateX(${swipeX}px)` }}
      >
        {children}
      </div>

      {!disabled && swipeX > 10 && !longPressed && (
        <div
          className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 items-center justify-center"
          style={{ opacity: Math.min(swipeX / SWIPE_THRESHOLD, 1) }}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              triggered
                ? "scale-110 bg-primary text-primary-content"
                : "bg-base-300 text-base-content/70"
            }`}
          >
            <CornerUpLeft className="h-4 w-4" />
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
    setEditingMessage,
    deleteMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const messageRefs = useRef({});
  const highlightTimeouts = useRef({});
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      Object.values(highlightTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const messageMap = useMemo(() => {
    const map = new Map();
    messages.forEach((msg) => map.set(msg._id, msg));
    return map;
  }, [messages]);

  const handleReply = (message, isMine) => {
    if (message.deletedForEveryone) return;

    setReplyTo({
      _id: message._id,
      text: message.text || null,
      image: message.image || null,
      gifUrl: message.gifUrl || null,
      senderName: isMine ? authUser.fullName : selectedUser.fullName,
    });
  };

  const scrollToOriginalMessage = (messageId) => {
    if (!messageId) return;
    const el = messageRefs.current[messageId];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setActiveHighlightId(messageId);

    if (highlightTimeouts.current[messageId]) {
      clearTimeout(highlightTimeouts.current[messageId]);
    }

    highlightTimeouts.current[messageId] = setTimeout(() => {
      setActiveHighlightId((current) => (current === messageId ? null : current));
    }, 1600);
  };

  const openActions = (message, isMine) => {
    if (!isMine || message.deletedForEveryone) return;
    setActionMessage(message);
  };

  const closeActions = () => setActionMessage(null);

  const handleEdit = () => {
    if (!actionMessage) return;

    if (actionMessage.image || actionMessage.gifUrl) {
      closeActions();
      return;
    }

    setEditingMessage({
      _id: actionMessage._id,
      text: actionMessage.text || "",
    });

    closeActions();
  };

  const handleDelete = async () => {
    if (!actionMessage) return;
    const messageId = actionMessage._id;
    closeActions();
    await deleteMessage(messageId);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-base-200">
        <div className="shrink-0">
          <ChatHeader />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>

        <div className="shrink-0">
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 sm:px-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-base font-medium text-base-content/70">No messages yet</p>
              <p className="mt-1 text-sm text-base-content/50">
                Start the conversation with {selectedUser?.fullName?.split(" ")[0]}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pb-2">
            {messages.map((message, index) => {
              const isMine =
                (message.senderid?._id || message.senderid)?.toString() ===
                authUser._id?.toString();

              const previousMessage = messages[index - 1];
              const previousIsSameSender =
                previousMessage &&
                (previousMessage.senderid?._id || previousMessage.senderid)?.toString() ===
                  (message.senderid?._id || message.senderid)?.toString();

              const hasReply = Boolean(message.replyTo?.messageId);
              const originalMessage = hasReply
                ? messageMap.get(message.replyTo.messageId)
                : null;

              const quotedSenderName =
                message.replyTo?.senderName === authUser.fullName
                  ? "You"
                  : message.replyTo?.senderName;

              const canEdit = isMine && !message.deletedForEveryone && !message.image && !message.gifUrl;

              const bubbleBlock = (
                <div
                  className={`group relative flex w-full items-end gap-1.5 ${
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
                        className="h-7 w-7 rounded-full border border-base-300 object-cover sm:h-8 sm:w-8"
                      />
                    ) : (
                      <div className="h-7 w-7 sm:h-8 sm:w-8" />
                    )}
                  </div>

                  <div
                    className={`relative flex min-w-0 flex-col ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    {isDesktop && isMine && !message.deletedForEveryone && (
                      <button
                        type="button"
                        onClick={() => openActions(message, isMine)}
                        className={`absolute top-1 z-20 flex h-8 min-w-[3.5rem] items-center justify-center rounded-full bg-base-100/95 px-3 text-[11px] font-medium text-base-content/70 shadow-sm ring-1 ring-base-300 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:text-primary ${
                          isMine ? "-left-16 opacity-0 group-hover:opacity-100" : "-right-16 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        Edit
                      </button>
                    )}

                    <div
                      ref={(el) => {
                        if (el) messageRefs.current[message._id] = el;
                      }}
                      className={`max-w-[82vw] sm:max-w-[70vw] md:max-w-[32rem] lg:max-w-[38rem] overflow-hidden rounded-2xl shadow-sm ring-1 transition-all duration-500 ${
                        activeHighlightId === message._id
                          ? "ring-primary/70 shadow-md scale-[1.01]"
                          : "ring-transparent"
                      } ${
                        isMine
                          ? "rounded-br-md bg-primary text-primary-content"
                          : "rounded-bl-md border border-base-300/50 bg-base-100 text-base-content"
                      } ${message.deletedForEveryone ? "opacity-80" : ""}`}
                    >
                      {hasReply && !message.deletedForEveryone && (
                        <button
                          type="button"
                          disabled={!originalMessage}
                          onClick={() => scrollToOriginalMessage(message.replyTo.messageId)}
                          className={`mx-2 mt-2 block w-[calc(100%-1rem)] rounded-xl border-l-4 px-2.5 py-1.5 text-left text-[11px] transition-colors duration-200 ${
                            isMine
                              ? "border-primary-content/45 bg-primary-content/15 text-primary-content/85 hover:bg-primary-content/20"
                              : "border-primary bg-base-200 text-base-content/72 hover:bg-base-300/70"
                          } ${originalMessage ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <p className="mb-0.5 truncate text-[10px] font-semibold">
                            {quotedSenderName}
                          </p>

                          {message.replyTo.text && (
                            <p className="truncate leading-4">{message.replyTo.text}</p>
                          )}
                        </button>
                      )}

                      {message.deletedForEveryone ? (
                        <div className="px-2.5 py-2">
                          <p className="text-[13px] italic opacity-75">This message was deleted</p>
                        </div>
                      ) : (
                        <>
                          {message.gifUrl && (
                            <img
                              src={message.gifUrl}
                              alt="gif"
                              className={`max-h-72 w-full max-w-full object-cover ${hasReply ? "mt-2" : ""}`}
                            />
                          )}

                          {message.image && (
                            <img
                              src={message.image}
                              alt="attachment"
                              className={`max-h-72 w-full max-w-full object-cover ${hasReply ? "mt-2" : ""}`}
                            />
                          )}

                          {message.text && (
                            <div className={message.image || message.gifUrl ? "px-2.5 py-2" : "px-2.5 py-1.5"}>
                              <p className="break-words whitespace-pre-wrap text-[14px] leading-[1.32] sm:text-[14.5px]">
                                {linkifyText(message.text)}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div
                      className={`mt-0.5 flex items-center gap-1 px-1 text-[10px] ${
                        isMine
                          ? "justify-end text-base-content/45"
                          : "justify-start text-base-content/40"
                      }`}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {message.isEdited && !message.deletedForEveryone && (
                        <span className="italic opacity-80">edited</span>
                      )}
                      {isMine &&
                        (message.seen ? (
                          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        ))}
                    </div>
                  </div>
                </div>
              );

              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                    previousIsSameSender ? "mt-0.5" : "mt-2.5"
                  }`}
                >
                  {isDesktop ? (
                    <div
                      onContextMenu={(e) => {
                        if (!isMine || message.deletedForEveryone) return;
                        e.preventDefault();
                        openActions(message, isMine);
                      }}
                      className="w-full"
                    >
                      {bubbleBlock}
                    </div>
                  ) : (
                    <SwipeableMessage
                      onSwipe={() => handleReply(message, isMine)}
                      onLongPress={() => openActions(message, isMine)}
                      disabled={false}
                    >
                      {bubbleBlock}
                    </SwipeableMessage>
                  )}
                </div>
              );
            })}

            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0">
        <MessageInput />
      </div>

      {actionMessage && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={closeActions} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-base-300 bg-base-100 p-3 shadow-2xl sm:left-1/2 sm:right-auto sm:bottom-6 sm:w-[24rem] sm:-translate-x-1/2 sm:rounded-3xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-base-300 sm:hidden" />

            <div className="mb-2 px-1">
              <p className="text-sm font-semibold text-base-content">Message actions</p>
              <p className="text-[11px] text-base-content/50">
                Choose what you want to do with this message
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-base-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Pencil className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-base-content">Edit</p>
                  <p className="text-[11px] text-base-content/50">Change your text message</p>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-error/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10 text-error">
                <Trash2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-base-content">Delete</p>
                <p className="text-[11px] text-base-content/50">Remove for everyone</p>
              </div>
            </button>

            <button
              type="button"
              onClick={closeActions}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-base-300 px-3 py-3 text-sm font-medium text-base-content/75 transition-colors hover:bg-base-200"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatContainer;
