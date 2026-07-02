"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { useAuthStore } from "./useAuth";
import { useInterviewFlowStore } from "./useInterviewFlow";

type DSAMessage = {
    _id: string;
    interviewId: string;
    questionId: string;
    userId: string;
    sentBy: "user" | "assistant";
    message: string;
    createdAt: string;
};

type DSAChatStore = {
    messages: DSAMessage[];

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

export const useDSAChatStore = create<DSAChatStore>((set, get) => ({
    messages: [],

    loading: false,
    sending: false,
    starting: false,

    getMessages: async (interviewId, questionId) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get(
                `/dsa-chat/get/${interviewId}/${questionId}`
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

    startInterview: async (interviewId, questionId) => {
        set({ starting: true });

        try {
            const res = await axiosInstance.post(
                `/dsa-chat/start/${interviewId}/${questionId}`
            );

            if (res.data.message) {
                toast.success(res.data.message);
            }

            return true;
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                "Failed to start DSA interview"
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
                `/dsa-chat/start-status/${interviewId}/${questionId}`
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
                `/dsa-chat/send/${interviewId}/${questionId}`,
                {
                    message,
                }
            );

            set({
                messages: [
                    ...get().messages,
                    res.data.message,
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

        socket.off("newMessageDSA");

        socket.on(
            "newMessageDSA",
            ({ newMessage, interviewId, questionId }: any) => {
                const { activeQuestionId } =
                    useInterviewFlowStore.getState();

                if (questionId === activeQuestionId) {
                    set((state) => ({
                        messages: [
                            ...state.messages,
                            newMessage,
                        ],
                    }));
                }
            }
        );
    },

    clearMessages: () => {
        set({
            messages: [],
        });
    },
}));