import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, CornerUpLeft, Gift, Search } from "lucide-react";
import toast from "react-hot-toast";

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [gifPreview, setGifPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const gifPanelRef = useRef(null);

  const { sendMessage, replyTo, clearReplyTo } = useChatStore();
  const { authUser } = useAuthStore();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gifPanelRef.current && !gifPanelRef.current.contains(e.target)) {
        setShowGifPicker(false);
      }
    };

    if (showGifPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showGifPicker]);

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
    setGifSearch("");
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

  const isMyReply = replyTo?.senderName === authUser?.fullName;

  return (
    <div className="relative border-t border-base-300 bg-base-100 px-2.5 py-2 sm:px-4 sm:py-3">
      <div ref={gifPanelRef} className="relative">
        {showGifPicker && (
          <div className="absolute bottom-full left-0 mb-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
            <div className="flex items-center gap-2 border-b border-base-300 px-3 py-2">
              <Search className="h-4 w-4 text-base-content/50" />
              <input
                type="text"
                value={gifSearch}
                onChange={(e) => setGifSearch(e.target.value)}
                placeholder="Search GIFs"
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-base-content/40"
              />
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(false);
                  setGifSearch("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-base-content/60 hover:bg-base-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {gifLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-xl bg-base-300/60" />
                  ))}
                </div>
              ) : (
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
                        className="overflow-hidden rounded-xl border border-base-300 bg-base-200/40 text-left hover:border-primary/40"
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
              )}
            </div>
          </div>
        )}
      </div>

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

        <button
          type="button"
          onClick={() => setShowGifPicker((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-100 transition-colors hover:bg-base-200 sm:h-11 sm:w-11"
        >
          <Gift className="h-4.5 w-4.5 text-base-content/70 sm:h-5 sm:w-5" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-100 transition-colors hover:bg-base-200 sm:h-11 sm:w-11"
        >
          <Image className="h-4.5 w-4.5 text-base-content/70 sm:h-5 sm:w-5" />
        </button>

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
