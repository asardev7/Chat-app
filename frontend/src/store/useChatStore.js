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
  editingMessage: null,
  unreadCounts: {},

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
      set((state) => ({
        messages: res.data,
        unreadCounts: {
          ...state.unreadCounts,
          [userId]: 0,
        },
      }));
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
              gifUrl: replyTo.gifUrl || null,
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

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
        editingMessage: null,
      }));

      toast.success("Message updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                text: "",
                image: "",
                gifUrl: "",
                replyTo: null,
                deletedForEveryone: true,
              }
            : msg
        ),
      }));

      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDeleted");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const authId = useAuthStore.getState().authUser?._id?.toString();
      const senderId = (newMessage.senderid?._id || newMessage.senderid)?.toString();
      const receiverId = (newMessage.receiverid?._id || newMessage.receiverid)?.toString();
      const selectedId = selectedUser?._id?.toString();

      const isRelevantIncoming = senderId === selectedId && receiverId === authId;
      const isRelevantOutgoing = senderId === authId && receiverId === selectedId;
      const isActiveChatIncoming = senderId === selectedId && receiverId === authId;

      if (isRelevantIncoming || isRelevantOutgoing) {
        set((state) => {
          const exists = state.messages.some((msg) => msg._id === newMessage._id);
          if (exists) return state;
          return { messages: [...state.messages, newMessage] };
        });
      }

      if (senderId !== authId && !isActiveChatIncoming) {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [senderId]: (state.unreadCounts[senderId] || 0) + 1,
          },
        }));
      }
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      }));
    });

    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                text: "",
                image: "",
                gifUrl: "",
                replyTo: null,
                deletedForEveryone: true,
              }
            : msg
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDeleted");
  },

  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  setEditingMessage: (message) =>
    set({
      editingMessage: message,
      replyTo: null,
    }),

  clearEditingMessage: () => set({ editingMessage: null }),

  clearUnreadForUser: (userId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [userId]: 0,
      },
    })),

  setSelectedUser: (selectedUser) =>
    set((state) => ({
      selectedUser,
      replyTo: null,
      editingMessage: null,
      unreadCounts: {
        ...state.unreadCounts,
        [selectedUser?._id]: 0,
      },
    })),
}));
