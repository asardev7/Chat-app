import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const { sendMessage } = useChatStore();

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
      inputRef.current?.blur();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`px-3 sm:px-4 pt-3 ${
        keyboardOpen
          ? "pb-2"
          : "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      }`}
    >
      {imagePreview && (
        <div className="mb-3 inline-flex relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-2xl border border-base-300"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-base-100 border border-base-300 flex items-center justify-center shadow-sm hover:bg-base-200 transition-colors"
          >
            <X className="w-4 h-4" />
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
          className="w-11 h-11 shrink-0 rounded-2xl border border-base-300 bg-base-100 hover:bg-base-200 flex items-center justify-center transition-colors"
        >
          <Image className="w-5 h-5 text-base-content/70" />
        </button>

        <div className="flex-1 rounded-2xl border border-base-300 bg-base-100 px-4 min-h-[44px] flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="w-full h-11 bg-transparent outline-none text-sm placeholder:text-base-content/40"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="w-11 h-11 shrink-0 rounded-2xl bg-primary text-primary-content flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
