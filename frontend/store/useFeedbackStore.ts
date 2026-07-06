"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";

export type DSAFeedback = {
    _id: string;
    interviewId: string;
    questionId: string;
    verdict: "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE";
    summary: string;
    scores: {
        problemSolving: number;
        communication: number;
        speed: number;
        codeQuality: number;
        correctness: number;
    };
};

export type GenericFeedback = {
    _id: string;
    interviewId: string;
    questionId: string;
    strength: string[];
    weakness: string[];
    improvement: string[];
};

export type Submission = {
    _id: string;
    interviewId: string;
    questionId: string;
    questionType: "DSA" | "CaseStudy" | "SystemDesign";
    language?: string;
    difficulty: "easy" | "medium" | "hard";
    isCorrect?: boolean;
    attemptNumber: number;
    totalPoint: number;
    percentageBeaten: number;
    createdAt: string;
};

type FeedbackStore = {
    dsaFeedback: DSAFeedback[];
    caseFeedback: GenericFeedback | null;
    sysdesFeedback: GenericFeedback | null;
    submissions: Submission[];

    loading: boolean;

    getDSAFeedback: (interviewId: string) => Promise<boolean>;
    getCaseFeedback: (interviewId: string) => Promise<boolean>;
    getSysdesFeedback: (interviewId: string) => Promise<boolean>;
    getSubmissions: (interviewId: string) => Promise<boolean>;

    clearFeedback: () => void;
};

export const useFeedbackStore = create<FeedbackStore>((set) => ({
    dsaFeedback: [],
    caseFeedback: null,
    sysdesFeedback: null,
    submissions: [],

    loading: false,

    getDSAFeedback: async (interviewId) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get(`/feedback/dsa/${interviewId}`);

            set({
                dsaFeedback: res.data.feedback,
            });

            return true;
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to fetch feedback");
            return false;
        } finally {
            set({ loading: false });
        }
    },

    getCaseFeedback: async (interviewId) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get(`/feedback/case/${interviewId}`);

            set({
                caseFeedback: res.data.feedback,
            });

            return true;
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to fetch feedback");
            return false;
        } finally {
            set({ loading: false });
        }
    },

    getSysdesFeedback: async (interviewId) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get(`/feedback/sysdes/${interviewId}`);

            set({
                sysdesFeedback: res.data.feedback,
            });

            return true;
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to fetch feedback");
            return false;
        } finally {
            set({ loading: false });
        }
    },

    getSubmissions: async (interviewId) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get(`/feedback/submission/${interviewId}`);

            set({
                submissions: res.data.submissions,
            });

            return true;
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to fetch submissions");
            return false;
        } finally {
            set({ loading: false });
        }
    },

    clearFeedback: () =>
        set({
            dsaFeedback: [],
            caseFeedback: null,
            sysdesFeedback: null,
            submissions: [],
        }),
}));