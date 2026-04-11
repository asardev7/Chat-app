import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    image: { type: String },
    seen: { type: Boolean, default: false }, // ← added
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
