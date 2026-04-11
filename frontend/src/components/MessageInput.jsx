import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  Image,
  Send,
  X,
  CornerUpLeft,
  Gift,
  Plus,
  Search,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [gifPreview, setGifPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [draggingSheet, setDraggingSheet] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const dragStartYRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const attachWrapRef = useRef(null);
  const gifSheetRef = useRef(null);

  const {
    sendMessage,
    replyTo,
    clearReplyTo,
    editingMessage,
    clearEditingMessage,
    editMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateViewportOffset = () => {
      if (!window.visualViewport || window.innerWidth >= 768) {
        setKeyboardOffset(0);
        return;
      }

      const vv = window.visualViewport;
      const bottomGap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(bottomGap);
    };

    updateViewportOffset();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportOffset);
      window.visualViewport.addEventListener("scroll", updateViewportOffset);
    }

    window.addEventListener("resize", updateViewportOffset);
    window.addEventListener("orientationchange", updateViewportOffset);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateViewportOffset);
        window.visualViewport.removeEventListener("scroll", updateViewportOffset);
      }
      window.removeEventListener("resize", updateViewportOffset);
      window.removeEventListener("orientationchange", updateViewportOffset);
    };
  }, []);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      setImagePreview(null);
      setGifPreview(null);
      setShowAttachMenu(false);
      setShowGifPicker(false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [editingMessage]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text, editingMessage]);

  const closeAllPopups = () => {
    setShowAttachMenu(false);
    setShowGifPicker(false);
    setGifSearch("");
    setSheetTranslateY(0);
    setDraggingSheet(false);
    dragStartYRef.current = null;
  };

  useEffect(() => {
    const handlePointerDown = (e) => {
      const clickedInsideAttach =
        attachWrapRef.current && attachWrapRef.current.contains(e.target);
      const clickedInsideGif =
        gifSheetRef.current && gifSheetRef.current.contains(e.target);

      if (!clickedInsideAttach && !clickedInsideGif) {
        closeAllPopups();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const fetchGifs = async (query = "") => {
    if (!GIPHY_KEY) {
      toast.error("Missing Giphy API key");
      return;
    }

    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=18&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=18&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setGifResults(data.data || []);
    } catch {
      toast.error("Failed to load GIFs");
    } finally {
      setGifLoading(false);
    }
  };

  useEffect(() => {
    if (!showGifPicker) return;
    fetchGifs("");
  }, [showGifPicker]);

  useEffect(() => {
    if (!showGifPicker) return;
    const timer = setTimeout(() => {
      fetchGifs(gifSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [gifSearch, showGifPicker]);

  const handleImageChange = (e) => {
    if (editingMessage) {
      toast.error("You can edit only text messages");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setGifPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeGif = () => {
    setGifPreview(null);
  };

  const handleSelectGif = (gif) => {
    if (editingMessage) {
      toast.error("You can edit only text messages");
      return;
    }

    const url =
      gif?.images?.fixed_height?.url ||
      gif?.images?.original?.url ||
      gif?.images?.preview_gif?.url;

    if (!url) return;

    setGifPreview(url);
    setImagePreview(null);
    setShowGifPicker(false);
    setShowAttachMenu(false);
    setGifSearch("");
    setSheetTranslateY(0);
  };

  const openGifPicker = () => {
    if (editingMessage) {
      toast.error("Attachments are disabled in edit mode");
      return;
    }

    setShowAttachMenu(false);
    setShowGifPicker(true);
    setSheetTranslateY(0);
  };

  const resetComposer = () => {
    setText("");
    setImagePreview(null);
    setGifPreview(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      textareaRef.current.style.height = "42px";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (editingMessage) {
      const nextText = text.trim();
      if (!nextText) return;

      setIsSending(true);
      try {
        await editMessage(editingMessage._id, nextText);
        resetComposer();
        clearEditingMessage();
      } catch (error) {
        console.error("Failed to edit message:", error);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (!text.trim() && !imagePreview && !gifPreview) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        gifUrl: gifPreview,
      });

      resetComposer();
      textareaRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSheetTouchStart = (e) => {
    if (!isMobile) return;
    dragStartYRef.current = e.touches[0].clientY;
    setDraggingSheet(true);
  };

  const handleSheetTouchMove = (e) => {
    if (!isMobile || dragStartYRef.current === null) return;
    const deltaY = e.touches[0].clientY - dragStartYRef.current;
    if (deltaY > 0) {
      setSheetTranslateY(deltaY);
    }
  };

  const handleSheetTouchEnd = () => {
    if (!isMobile) return;

    if (sheetTranslateY > 110) {
      closeAllPopups();
    } else {
      setSheetTranslateY(0);
    }

    setDraggingSheet(false);
    dragStartYRef.current = null;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const isMyReply = replyTo?.senderName === authUser?.fullName;
  const canSend = editingMessage
    ? Boolean(text.trim())
    : Boolean(text.trim() || imagePreview || gifPreview);

  return (
    <div
      className="relative shrink-0 border-t border-base-300 bg-base-100 px-2.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3"
      style={{
        transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : "translateY(0)",
        transition: "transform 180ms ease",
      }}
    >
      {editingMessage && (
        <div className="mb-2.5 flex items-start gap-2 rounded-2xl border border-warning/20 bg-warning/10 px-2.5 py-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Pencil className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-warning">Editing message</p>
            <p className="truncate text-[12px] text-base-content/65">
              Update your text and send to save changes
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearEditingMessage();
              resetComposer();
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base-content/55 transition-colors hover:bg-base-300 hover:text-base-content"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!editingMessage && replyTo && (
        <div className="mb-2.5 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/70 px-2.5 py-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CornerUpLeft className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-primary">
              {isMyReply ? "You" : replyTo.senderName}
            </p>

            {replyTo.text ? (
              <p className="whitespace-pre-wrap break-words text-[12px] leading-4 text-base-content/65">
                {replyTo.text}
              </p>
            ) : replyTo.image ? (
              <p className="text-[12px] text-base-content/65">📷 Photo</p>
            ) : replyTo.gifUrl ? (
              <p className="text-[12px] text-base-content/65">GIF</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={clearReplyTo}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base-content/55 transition-colors hover:bg-base-300 hover:text-base-content"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <div ref={attachWrapRef} className="relative shrink-0">
          <button
            type="button"
            disabled={Boolean(editingMessage)}
            onClick={() => {
              setShowAttachMenu((prev) => !prev);
              if (showGifPicker) setShowGifPicker(false);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-base-300 bg-base-100 transition-all duration-200 hover:bg-base-200 sm:h-11 sm:w-11 ${
              showAttachMenu ? "rotate-45 text-primary" : "text-base-content/70"
            } ${editingMessage ? "cursor-not-allowed opacity-45" : ""}`}
          >
            <Plus className="h-5 w-5" />
          </button>

          {showAttachMenu && !showGifPicker && !editingMessage && (
            <div className="absolute bottom-full left-0 mb-2 w-44 rounded-3xl border border-base-300 bg-base-100 p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-base-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-base-200 text-base-content/75">
                  <Image className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-base-content">Photo</p>
                  <p className="text-[11px] text-base-content/50">Upload image</p>
                </div>
              </button>

              <button
                type="button"
                onClick={openGifPicker}
                className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-base-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Gift className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-base-content">GIF</p>
                  <p className="text-[11px] text-base-content/50">Search Giphy</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="flex min-h-[44px] flex-1 items-end rounded-2xl border border-base-300 bg-base-100 px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? "Edit your message..." : replyTo ? "Reply..." : "Type a message..."}
            className="max-h-[140px] min-h-[24px] w-full resize-none bg-transparent text-[14px] leading-5 outline-none placeholder:text-base-content/40"
            style={{
              overflowY: text.length > 0 ? "auto" : "hidden",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!canSend || isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content transition-all duration-200 hover:scale-[1.02] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
        >
          <Send className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
