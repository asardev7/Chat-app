import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="px-3 py-3 border-t border-base-300 bg-base-100">

      {imagePreview && (
        <div className="mb-2 relative w-fit">
          <img
            src={imagePreview}
            alt="preview"
            className="h-20 w-20 object-cover rounded-lg border border-base-300"
          />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 btn btn-xs btn-circle btn-error"
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}


      <form onSubmit={handleSendMessage} className="flex items-center gap-2">

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-ghost btn-sm btn-circle flex-shrink-0 text-zinc-400 hover:text-primary"
          aria-label="Attach image"
        >
          <Image className="w-5 h-5" />
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 input input-bordered input-sm rounded-full text-sm min-w-0"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isSending}
          className="btn btn-primary btn-sm btn-circle flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
