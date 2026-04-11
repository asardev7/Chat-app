import { useEffect, useRef, useState } from "react";
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

  const dragStartYRef = useRef(null);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const attachWrapRef = useRef(null);
  const gifSheetRef = useRef(null);

  const { sendMessage, replyTo, clearReplyTo } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeAllPopups = () => {
    setShowAttachMenu(false);
    setShowGifPicker(false);
    setGifSearch("");
    setSheetTranslateY(0);
    setDraggingSheet(false);
    dragStartYRef.current = null;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        attachWrapRef.current &&
        !attachWrapRef.current.contains(e.target) &&
        gifSheetRef.current &&
        !gifSheetRef.current.contains(e.target)
      ) {
        closeAllPopups();
      }

      if (
        attachWrapRef.current &&
        !attachWrapRef.current.contains(e.target) &&
        !showGifPicker
      ) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGifPicker]);

  const fetchGifs = async (query = "") => {
    if (!GIPHY_KEY) {
      toast.error("Missing Giphy API key");
      return;
    }

    setGifLoading(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(
            query
          )}&limit=18&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=18&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setGifResults(data.data || []);
    } catch (error) {
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
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
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
    setShowAttachMenu(false);
    setShowGifPicker(true);
    setSheetTranslateY(0);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !gifPreview) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        gifUrl: gifPreview,
      });

      setText("");
      setImagePreview(null);
      setGifPreview(null);

      if (fileInputRef.current) fileInputRef.current.value = "";
      inputRef.current?.focus();
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

  const isMyReply = replyTo?.senderName === authUser?.fullName;

  return (
    <div className="relative border-t border-base-300 bg-base-100 px-2.5 py-2 sm:px-4 sm:py-3">
      {showGifPicker && (
        <>
          <div
            className={`absolute inset-0 z-30 bg-black/20 ${
              isMobile ? "fixed" : "absolute"
            }`}
            onClick={() => closeAllPopups()}
          />

          <div
            ref={gifSheetRef}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onTouchCancel={handleSheetTouchEnd}
            className={`z-40 overflow-hidden border border-base-300 bg-base-100 shadow-2xl ${
              isMobile
                ? "fixed inset-x-0 bottom-0 mx-auto h-[68vh] rounded-t-[28px]"
                : "absolute bottom-full left-0 mb-2 w-[min(92vw,24rem)] rounded-3xl"
            } ${draggingSheet ? "transition-none" : "transition-transform duration-250 ease-out"}`}
            style={
              isMobile ? { transform: `translateY(${sheetTranslateY}px)` } : undefined
            }
          >
            {isMobile && (
              <div className="flex justify-center pt-2.5">
                <div className="h-1.5 w-12 rounded-full bg-base-300" />
              </div>
            )}

            <div className="flex items-center gap-2 border-b border-base-300 px-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Gift className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-base-content">GIFs</p>
                <p className="text-[11px] text-base-content/50">
                  {gifSearch.trim() ? "Search results" : "Trending right now"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => closeAllPopups()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-base-content/60 transition-colors hover:bg-base-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="border-b border-base-300 px-3 py-2.5">
              <div className="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-3">
                <Search className="h-4 w-4 text-base-content/45" />
                <input
                  type="text"
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  placeholder="Search GIFs"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-base-content/35"
                />
              </div>
            </div>

            <div className="h-[calc(100%-8.5rem)] overflow-y-auto p-2.5">
              {gifLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-2xl bg-base-300/60"
                    />
                  ))}
                </div>
              ) : gifResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {gifResults.map((gif) => {
                    const thumb =
                      gif?.images?.fixed_height_small?.url ||
                      gif?.images?.fixed_height?.url ||
                      gif?.images?.preview_gif?.url;

                    return (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => handleSelectGif(gif)}
                        className="group overflow-hidden rounded-2xl border border-base-300 bg-base-200/30 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                      >
                        <img
                          src={thumb}
                          alt={gif.title || "GIF"}
                          className="h-28 w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center">
                  <div>
                    <p className="text-sm font-semibold text-base-content/70">
                      No GIFs found
                    </p>
                    <p className="mt-1 text-xs text-base-content/50">
                      Try another keyword
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/70 px-2.5 py-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CornerUpLeft className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-primary">
              {isMyReply ? "You" : replyTo.senderName}
            </p>

            {replyTo.text ? (
              <p className="truncate text-[12px] text-base-content/65">{replyTo.text}</p>
            ) : replyTo.image ? (
              <p className="truncate text-[12px] text-base-content/65">📷 Photo</p>
            ) : replyTo.gifUrl ? (
              <p className="truncate text-[12px] text-base-content/65">GIF</p>
            ) : null}
          </div>

          {replyTo.image && (
            <img
              src={replyTo.image}
              alt="reply preview"
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
          )}

          {replyTo.gifUrl && (
            <img
              src={replyTo.gifUrl}
              alt="reply gif preview"
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
          )}

          <button
            type="button"
            onClick={clearReplyTo}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base-content/55 transition-colors hover:bg-base-300 hover:text-base-content"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="relative mb-2 inline-flex">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 w-20 rounded-2xl border border-base-300 object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow-sm transition-colors hover:bg-base-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {gifPreview && (
        <div className="relative mb-2 inline-flex">
          <img
            src={gifPreview}
            alt="GIF Preview"
            className="h-20 w-20 rounded-2xl border border-base-300 object-cover"
          />
          <button
            type="button"
            onClick={removeGif}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow-sm transition-colors hover:bg-base-200"
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
            onClick={() => {
              setShowAttachMenu((prev) => !prev);
              if (showGifPicker) setShowGifPicker(false);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-base-300 bg-base-100 transition-all duration-200 hover:bg-base-200 sm:h-11 sm:w-11 ${
              showAttachMenu ? "rotate-45 text-primary" : "text-base-content/70"
            }`}
          >
            <Plus className="h-5 w-5" />
          </button>

          {showAttachMenu && !showGifPicker && (
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

        <div className="flex min-h-[42px] flex-1 items-center rounded-2xl border border-base-300 bg-base-100 px-3 sm:min-h-[44px] sm:px-4">
          <input
            ref={inputRef}
            type="text"
            className="h-10 w-full bg-transparent text-[14px] outline-none placeholder:text-base-content/40 sm:h-11 sm:text-sm"
            placeholder={replyTo ? "Reply..." : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview && !gifPreview) || isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content transition-all duration-200 hover:scale-[1.02] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
        >
          <Send className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
