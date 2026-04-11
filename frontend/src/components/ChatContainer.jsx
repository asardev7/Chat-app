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

const SwipeableMessage = ({ children, onSwipe, disabled }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const reset = () => {
    setSwipeX(0);
    setSwiping(false);
    setTriggered(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleTouchStart = (e) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(true);
    setTriggered(false);
  };

  const handleTouchMove = (e) => {
    if (disabled || touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (deltaY > 24) {
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
    if (triggered) onSwipe();
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

      {!disabled && swipeX > 10 && (
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

const DesktopMessageActions = ({
  isMine,
  canEdit,
  message,
  handleReply,
  openActions,
  setEditingMessage,
}) => {
  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-20 hidden -translate-y-1/2 items-center gap-1 rounded-2xl border border-base-300 bg-base-100/95 p-1 shadow-lg backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 lg:flex ${
        isMine ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"
      }`}
    >
      <button
        type="button"
        onClick={() => handleReply(message, isMine)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-base-content/70 transition-colors hover:bg-base-200 hover:text-primary"
        title="Reply"
      >
        <CornerUpLeft className="h-4 w-4" />
      </button>

      {isMine && canEdit && (
        <button
          type="button"
          onClick={() =>
            setEditingMessage({
              _id: message._id,
              text: message.text || "",
            })
          }
          className="flex h-8 w-8 items-center justify-center rounded-xl text-base-content/70 transition-colors hover:bg-base-200 hover:text-primary"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {isMine && (
        <button
          type="button"
          onClick={() => openActions(message, isMine)}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-base-content/70 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
  const scrollAreaRef = useRef(null);
  const messageRefs = useRef({});
  const highlightTimeouts = useRef({});
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messageEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => clearTimeout(timer);
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

  const openActions = (message, isMine) => {
    if (!isMine || message.deletedForEveryone) return;
    setActionMessage(message);
  };

  const closeActions = () => setActionMessage(null);

  const handleDelete = async () => {
    if (!actionMessage) return;
    const messageId = actionMessage._id;
    closeActions();
    await deleteMessage(messageId);
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

  if (isMessagesLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-base-200">
        <ChatHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-base-200">
      <ChatHeader />

      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3 md:px-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="text-lg font-semibold text-base-content/75">
                No messages yet
              </p>
              <p className="mt-1 text-sm text-base-content/50">
                Start the conversation with {selectedUser?.fullName?.split(" ")[0]}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pb-24 sm:pb-28">
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

              const canEdit =
                isMine &&
                !message.deletedForEveryone &&
                !message.image &&
                !message.gifUrl &&
                !message.isEdited;

              const bubbleBlock = (
                <div
                  className={`group relative flex w-full items-end gap-2 ${
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
                    {isDesktop && !message.deletedForEveryone && (
                      <DesktopMessageActions
                        isMine={isMine}
                        canEdit={canEdit}
                        message={message}
                        handleReply={handleReply}
                        openActions={openActions}
                        setEditingMessage={setEditingMessage}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!isDesktop) openActions(message, isMine);
                      }}
                      className="text-left"
                    >
                      <div
                        ref={(el) => {
                          if (el) messageRefs.current[message._id] = el;
                        }}
                        className={`max-w-[78vw] sm:max-w-[65vw] md:max-w-[34rem] lg:max-w-[40rem] overflow-hidden rounded-2xl shadow-sm ring-1 transition-all duration-300 ${
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
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToOriginalMessage(message.replyTo.messageId);
                            }}
                            className={`mx-2 mt-2 block w-[calc(100%-1rem)] rounded-xl border-l-4 px-2.5 py-1.5 text-left text-[11px] transition-colors duration-200 ${
                              isMine
                                ? "border-primary-content/45 bg-primary-content/15 text-primary-content/85 hover:bg-primary-content/20"
                                : "border-primary bg-base-200 text-base-content/72 hover:bg-base-300/70"
                            } ${originalMessage ? "cursor-pointer" : "cursor-default"}`}
                          >
                            <p className="mb-0.5 truncate text-[10px] font-semibold">
                              {quotedSenderName}
                            </p>

                            {message.replyTo.text ? (
                              <p className="truncate leading-4">{message.replyTo.text}</p>
                            ) : message.replyTo.image ? (
                              <p className="truncate leading-4">📷 Photo</p>
                            ) : message.replyTo.gifUrl ? (
                              <p className="truncate leading-4">GIF</p>
                            ) : null}
                          </button>
                        )}

                        {message.deletedForEveryone ? (
                          <div className="px-2.5 py-2">
                            <p className="text-[13px] italic opacity-75">
                              This message was deleted
                            </p>
                          </div>
                        ) : (
                          <>
                            {message.gifUrl && (
                              <img
                                src={message.gifUrl}
                                alt="gif"
                                className={`max-h-72 w-full max-w-full object-cover ${
                                  hasReply ? "mt-2" : ""
                                }`}
                              />
                            )}

                            {message.image && (
                              <img
                                src={message.image}
                                alt="attachment"
                                className={`max-h-72 w-full max-w-full object-cover ${
                                  hasReply ? "mt-2" : ""
                                }`}
                              />
                            )}

                            {message.text && (
                              <div
                                className={
                                  message.image || message.gifUrl ? "px-2.5 py-2" : "px-2.5 py-1.5"
                                }
                              >
                                <p className="break-words whitespace-pre-wrap text-[14px] leading-[1.32] sm:text-[14.5px]">
                                  {linkifyText(message.text)}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </button>

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
                  <SwipeableMessage
                    onSwipe={() => handleReply(message, isMine)}
                    disabled={false}
                  >
                    {bubbleBlock}
                  </SwipeableMessage>
                </div>
              );
            })}

            <div ref={messageEndRef} className="h-6 sm:h-8" />
          </div>
        )}
      </div>

      <MessageInput />

      {actionMessage && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={closeActions}
          />
          <div className="fixed left-1/2 bottom-4 z-50 w-[min(92vw,22rem)] -translate-x-1/2 rounded-3xl border border-base-300 bg-base-100 p-3 shadow-2xl">
            <div className="mb-2 px-1">
              <p className="text-sm font-semibold text-base-content">Message actions</p>
              <p className="text-[11px] text-base-content/50">
                Tap an action below
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  actionMessage.image ||
                  actionMessage.gifUrl ||
                  actionMessage.isEdited ||
                  actionMessage.deletedForEveryone
                }
                onClick={() =>
                  setEditingMessage({
                    _id: actionMessage._id,
                    text: actionMessage.text || "",
                  })
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 bg-base-200 hover:bg-base-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Pencil className="h-4.5 w-4.5" />
                <span className="text-sm font-medium">Edit</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 bg-error/10 text-error hover:bg-error/15"
              >
                <Trash2 className="h-4.5 w-4.5" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>

            <button
              type="button"
              onClick={closeActions}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-base-300 px-3 py-3 text-sm font-medium text-base-content/75 hover:bg-base-200"
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
