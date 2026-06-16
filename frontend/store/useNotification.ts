"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { useAuthStore } from "./useAuth";

export type Notification = {
  _id: string;
  userId: string;

  title: string;
  message: string;

  link?: string;

  read: boolean;

  meta?: Record<string, any>;

  createdAt: string;
  updatedAt: string;
};

type NotificationStore = {
  notifications: Notification[];
  unreadCount: number;    
  loading: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;

  removeNotification: (id: string) => Promise<boolean>;
  readNotifications: (ids: string[]) => Promise<boolean>;

  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;

  subscribetoNotifications: () => void;
};

export const useNotificationStore = create<NotificationStore>(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,

    loading: false,

    // ---------------- FETCH ----------------
    fetchNotifications: async () => {
      set({ loading: true });

      try {
        const res = await axiosInstance.get(
          "/notification/notifications"
        );
        
        
        console.log(res)
        set({
          notifications: res?.data?.notifications || [],
        });
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            "Failed to fetch notifications"
        );
      } finally {
        set({ loading: false });
      }
    },


    fetchUnreadCount: async () => {
        try {
            const res = await axiosInstance.get(
                "/notification/unread-notification/count"
            );

            set({
            unreadCount: res.data.unreadMessageCount ?? 0,
            });
        } catch (err: any) {
            toast.error(
            err?.response?.data?.message ||
            "Failed to fetch unread count"
            );
        }
    },

    // ---------------- REMOVE ----------------
    removeNotification: async (id) => {
      try {
        const notification = get().notifications.find(
          (n) => n._id === id
        );

        await axiosInstance.delete(
          `/notification/notifications/${id}`
        );

        set((state) => ({
          notifications: state.notifications.filter(
            (n) => n._id !== id
          ),
          unreadCount:
            notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
        }));

        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
          "Failed to remove notification"
        );
        return false;
      }
    },

    // ---------------- MARK READ ----------------
    readNotifications: async (ids) => {
      try {
        await axiosInstance.put(
          "/notification/notifications",
          ids
        );

        const unreadMarked = get().notifications.filter(
          (n) => ids.includes(n._id) && !n.read
        ).length;

        set((state) => ({
          notifications: state.notifications.map((n) =>
            ids.includes(n._id)
              ? { ...n, read: true }
              : n
          ),
          unreadCount: Math.max(
            0,
            state.unreadCount - unreadMarked
          ),
        }));

        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
          "Failed to mark notifications as read"
        );
        return false;
      }
    },

    subscribetoNotifications: () => {
      const  { socket } = useAuthStore.getState();
      
      if (!socket) return;

      socket.off("notifications_created");


      socket.on("notifications_created", (data:any) =>  {
        toast.success("New notification");
        get().addNotification(data.notification);
      });
    },

    // ---------------- SOCKET HELPERS ----------------
    addNotification: (notification) => {
      set((state) => ({
        notifications: [
          notification,
          ...state.notifications,
        ],
        unreadCount: state.unreadCount + 1,
      }));
    },

    clearNotifications: () => {
      set({ notifications: [] });
    },
  })
);