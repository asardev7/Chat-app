import User from "../models/user.model.js";
import Message from "../middleware/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.io.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderid: senderId, receiverid: userToChatId },
        { senderid: userToChatId, receiverid: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, gifUrl, replyTo } = req.body;
    const { id: receiverid } = req.params;
    const senderid = req.user._id;

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderid,
      receiverid,
      text: text || "",
      image: imageUrl || "",
      gifUrl: gifUrl || "",
      replyTo: replyTo
        ? {
            messageId: replyTo.messageId || null,
            text: replyTo.text || null,
            image: replyTo.image || null,
            gifUrl: replyTo.gifUrl || null,
            senderName: replyTo.senderName || null,
          }
        : null,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverid);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id.toString();

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderid.toString() !== userId) {
      return res.status(403).json({ message: "You can edit only your own messages" });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ message: "Deleted message cannot be edited" });
    }

    if (message.isEdited) {
      return res.status(400).json({ message: "Message can be edited only one time" });
    }

    if (message.image || message.gifUrl) {
      return res.status(400).json({ message: "Only text messages can be edited" });
    }

    const nextText = (text || "").trim();

    if (!nextText) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    message.text = nextText;
    message.isEdited = true;

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverid.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUpdated", message);
    }

    const senderSocketId = getReceiverSocketId(message.senderid.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageUpdated", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in editMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id.toString();

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderid.toString() !== userId) {
      return res.status(403).json({ message: "You can delete only your own messages" });
    }

    message.text = "";
    message.image = "";
    message.gifUrl = "";
    message.replyTo = null;
    message.deletedForEveryone = true;

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverid.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId: message._id });
    }

    const senderSocketId = getReceiverSocketId(message.senderid.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId: message._id });
    }

    res.status(200).json({ success: true, messageId: message._id });
  } catch (error) {
    console.error("Error in deleteMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderid: senderId, receiverid: receiverId, seen: false },
      { $set: { seen: true } }
    );

    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        by: receiverId,
        from: senderId,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark seen error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
