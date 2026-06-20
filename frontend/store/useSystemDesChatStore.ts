"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { useAuthStore } from "./useAuth";

type SysDesMessage = {
    role: "assistant" | "user";
    content: string;
    createdAt?: string;
};

type SysDesStore = {
    messages: SysDesMessage[];

    loading: boolean;
    sending: boolean;
    starting: boolean;

    getMessages: (
        interviewId: string,
        questionId: string
    ) => Promise<void>;

    startInterview: (
        interviewId: string,
        questionId: string
    ) => Promise<boolean>;

    getStartStatus: (
        interviewId: string,
        questionId: string
    ) => Promise<boolean>;

    sendMessage: (
        interviewId: string,
        questionId: string,
        message: string
    ) => Promise<void>;

    clearMessages: () => void;
    subscribetoMessages: () => void;
};

export const useSysDesStore = create<SysDesStore>(
    (set, get) => ({
        messages: [],

        loading: false,
        sending: false,
        starting: false,

        getMessages: async (
            interviewId,
            questionId
        ) => {
            set({ loading: true });

            try {
                const res = await axiosInstance.get(
                    `/submission/${interviewId}/sysdes/${questionId}/messages`
                );

                set({
                    messages: res.data.messages || [],
                });
            } catch (err: any) {
                toast.error(
                    err?.response?.data?.message ||
                    "Failed to load messages"
                );
            } finally {
                set({ loading: false });
            }
        },

        startInterview: async (
            interviewId,
            questionId
        ) => {
            set({ starting: true });

            try {
                const res = await axiosInstance.post(
                    `/submission/${interviewId}/sysdes/${questionId}/start`
                );

                if (res.data.message) {
                    toast.success(res.data.message);
                }

                return true;
            } catch (err: any) {
                toast.error(
                    err?.response?.data?.message ||
                    "Failed to start system design interview"
                );

                return false;
            } finally {
                set({ starting: false });
            }
        },

        getStartStatus: async (
            interviewId,
            questionId
        ) => {
            try {
                const res = await axiosInstance.get(
                    `/submission/${interviewId}/sysdes/${questionId}/start`
                );

                return res.data.started;
            } catch (err: any) {
                toast.error(
                    err?.response?.data?.message ||
                    "Failed to get start status"
                );

                return false;
            }
        },

        sendMessage: async (
            interviewId,
            questionId,
            message
        ) => {
            set({ sending: true });

            try {
                const res = await axiosInstance.post(
                    `/submission/${interviewId}/sysdes/${questionId}/message`,
                    {
                        message,
                    }
                );

                set({
                    messages: [
                        ...get().messages,
                        res.data.newMessage,
                    ],
                });
            } catch (err: any) {
                toast.error(
                    err?.response?.data?.message ||
                    "Failed to send message"
                );
            } finally {
                set({ sending: false });
            }
        },

        subscribetoMessages: () => {
            const { socket } = useAuthStore.getState();

            if (!socket) return;

            socket.off("newMessageSysDes")

            socket.on("newMessageSysDes", ({ newMessage }: any) => {
                set((state) => ({ messages: [...state.messages, newMessage] }))
            })
        },

        clearMessages: () => {
            set({
                messages: [],
            });
        },
    })
);