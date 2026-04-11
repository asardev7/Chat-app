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

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response?.data?.message || "Error");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

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
      const { selectedUser, messages } = get();
      if (!selectedUser) return;
      if (selectedUser._id === newMessage.senderid) {
        set({ messages: [...messages, newMessage] });
        axiosInstance.put(`/messages/seen/${selectedUser._id}`).catch(() => {});
      }
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

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
