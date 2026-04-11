import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Reply } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, replyTo, clearReplyTo } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    const updateKeyboardState = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const fullHeight = window.innerHeight;
      setKeyboardOpen(fullHeight - viewportHeight > 120);
    };

    updateKeyboardState();

    window.visualViewport?.addEventListener("resize", updateKeyboardState);
    window.visualViewport?.addEventListener("scroll", updateKeyboardState);
    window.addEventListener("resize", updateKeyboardState);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateKeyboardState);
      window.visualViewport?.removeEventListener("scroll", updateKeyboardState);
      window.removeEventListener("resize", updateKeyboardState);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);

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
    <div
      className={`px-3 sm:px-4 pt-2 ${
        keyboardOpen ? "pb-2" : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      }`}
    >
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-2xl border border-base-300 bg-base-200/70 px-3 py-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Reply className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-primary">
              {isMyReply ? "You" : replyTo.senderName}
            </p>

            {replyTo.image && !replyTo.text && (
              <p className="truncate text-[12px] text-base-content/60">📷 Photo</p>
            )}

            {replyTo.text && (
              <p className="truncate text-[12px] text-base-content/60">{replyTo.text}</p>
            )}
          </div>

          {replyTo.image && (
            <img
              src={replyTo.image}
              alt="reply preview"
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
            />
          )}

          <button
            type="button"
            onClick={clearReplyTo}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-base-300 transition-colors"
          >
            <X className="h-4 w-4 text-base-content/60" />
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

      <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-100 transition-colors hover:bg-base-200"
        >
          <Image className="h-5 w-5 text-base-content/70" />
        </button>

        <div className="flex min-h-[44px] flex-1 items-center rounded-2xl border border-base-300 bg-base-100 px-4">
          <input
            ref={inputRef}
            type="text"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-base-content/40"
            placeholder={replyTo ? "Reply..." : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
