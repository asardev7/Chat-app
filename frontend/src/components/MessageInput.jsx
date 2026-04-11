import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, CornerUpLeft } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const { sendMessage, replyTo, clearReplyTo } = useChatStore();
  const { authUser } = useAuthStore();

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
    <div className="border-t border-base-300 bg-base-100 px-2.5 py-2 sm:px-4 sm:py-3">
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
            ) : null}
          </div>

          {replyTo.image && (
            <img
              src={replyTo.image}
              alt="reply preview"
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
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-content transition-all duration-200 hover:scale-[1.02] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
        >
          <Send className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
