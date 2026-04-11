import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  replyTo: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      await axiosInstance.put(`/messages/seen/${userId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyTo } = get();

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
        ...messageData,
        replyTo: replyTo
          ? {
              messageId: replyTo._id,
              text: replyTo.text || null,
              image: replyTo.image || null,
              senderName: replyTo.senderName || "Unknown",
            }
          : null,
      });

      set({
        messages: [...messages, res.data],
        replyTo: null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  markMessagesAsSeen: async (userId) => {
    try {
      await axiosInstance.put(`/messages/seen/${userId}`);
    } catch (error) {
      console.error("Mark seen error:", error.response?.data || error.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      if (!selectedUser) return;

      const incomingSenderId = (newMessage.senderid?._id || newMessage.senderid)?.toString();
      if (selectedUser._id?.toString() !== incomingSenderId) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      axiosInstance.put(`/messages/seen/${selectedUser._id}`).catch(() => {});
    });

    socket.on("messagesSeen", ({ from }) => {
      const authUser = useAuthStore.getState().authUser;

      set((state) => ({
        messages: state.messages.map((msg) => {
          const msgSenderId = (msg.senderid?._id || msg.senderid)?.toString();
          const msgReceiverId = (msg.receiverid?._id || msg.receiverid)?.toString();

          if (
            msgSenderId === authUser._id?.toString() &&
            msgReceiverId === from?.toString()
          ) {
            return { ...msg, seen: true };
          }

          return msg;
        }),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messagesSeen");
  },

  setSelectedUser: (selectedUser) =>
    set({
      selectedUser,
      replyTo: null,
    }),
}));
