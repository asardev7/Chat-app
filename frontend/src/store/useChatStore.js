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
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, replyTo } = get();

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

      set((state) => ({
        messages: [...state.messages, res.data],
        replyTo: null,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      if (!selectedUser) return;

      const senderId = (newMessage.senderid?._id || newMessage.senderid)?.toString();
      const receiverId = (newMessage.receiverid?._id || newMessage.receiverid)?.toString();
      const selectedId = selectedUser._id?.toString();
      const authId = useAuthStore.getState().authUser?._id?.toString();

      const isRelevantIncoming = senderId === selectedId && receiverId === authId;
      const isRelevantOutgoing = senderId === authId && receiverId === selectedId;

      if (!isRelevantIncoming && !isRelevantOutgoing) return;

      set((state) => {
        const exists = state.messages.some((msg) => msg._id === newMessage._id);
        if (exists) return state;
        return { messages: [...state.messages, newMessage] };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },

  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  setSelectedUser: (selectedUser) =>
    set({
      selectedUser,
      replyTo: null,
    }),
}));
