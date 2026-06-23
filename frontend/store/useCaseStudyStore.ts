"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { useAuthStore } from "./useAuth";

type CaseMessage = {
    role: "assistant" | "user";
    content: string;
    createdAt?: string;
};

type CaseStore = {
    messages: CaseMessage[];

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

    sendMessage: (
        interviewId: string,
        questionId: string,
        message: string
    ) => Promise<void>;

    clearMessages: () => void;
    subscribetoMessages: () => void;
};

export const useCaseStore = create<CaseStore>(
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
                    `/submission/${interviewId}/case/${questionId}/messages`
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
                    `/submission/${interviewId}/case/${questionId}/start`
                );

                if (res.data.message) {
                    toast.success(res.data.message);
                }

                return true;
            } catch (err: any) {
                toast.error(
                    err?.response?.data?.message ||
                    "Failed to start case study interview"
                );

                return false;
            } finally {
                set({ starting: false });
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
                    `/submission/${interviewId}/case/${questionId}/message`,
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

            socket.off("newMessageCase");

            socket.on("newMessageCase", ({ newMessage }: any) => {
                set((state) => ({
                    messages: [...state.messages, newMessage],
                }));
            });
        },

        clearMessages: () => {
            set({
                messages: [],
            });
        },
    })
);