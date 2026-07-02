"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";

type RunResult = any;
type SubmissionResult = any;

type DSAStore = {
    running: boolean;
    submitting: boolean;

    runResult: RunResult | null;
    submissionResult: SubmissionResult | null;

    runCode: (
        interviewId: string,
        questionId: string,
        language: string,
        code: string
    ) => Promise<RunResult | null>;

    submitCode: (
        interviewId: string,
        questionId: string,
        language: string,
        code: string
    ) => Promise<SubmissionResult | null>;

    clearResults: () => void;
};

export const useDSAExecStore = create<DSAStore>((set) => ({
    running: false,
    submitting: false,

    runResult: null,
    submissionResult: null,

    runCode: async (interviewId, questionId, language, code) => {
        set({ running: true });

        try {
            const res = await axiosInstance.post(
                `/submission/${interviewId}/dsa/${questionId}/run`,
                {
                    language,
                    code,
                }
            );



            set({
                runResult: res.data,
            });

            return res.data;
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || "Failed to run code"
            );
            return null;
        } finally {
            set({ running: false });
        }
    },

    submitCode: async (interviewId, questionId, language, code) => {
        set({ submitting: true });

        try {
            const res = await axiosInstance.post(
                `/submission/${interviewId}/dsa/${questionId}/submit`,
                {
                    language,
                    code,
                }
            );

            set({
                submissionResult: res.data,
            });

            return res.data;
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || "Failed to submit code"
            );
            return null;
        } finally {
            set({ submitting: false });
        }
    },

    clearResults: () => {
        set({
            runResult: null,
            submissionResult: null,
        });
    },
}));