"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";

export type Interview = {
  _id: string;
  type: "case" | "dsa-only" | "system_design" | "mixed";
  status: "started" | "cancelled" | "scheduled" | "completed";
  duration: number;

  questions: {
    dsa: any[];
    sysDes: any[];
    case: any[];
  };

  createdAt?: string;
  updatedAt?: string;
};

type InterviewFlowStore = {
  interview: Interview | null;

  loading: boolean;
  startingInterview: boolean;

  activeInterviewId: string | null,
  activeInterviewTime: number | null,

  activeQuestionId: string | null;
  activeQuestionType: "dsa" | "sysDes" | "case" | "none";

  setActiveQuestionId: (id: string, type: "dsa" | "sysDes" | "case" | "none") => void;


  startInterview: (id: string) => Promise<boolean>;
  getRemainingTime: (id: string) => Promise<number | null>;
  fetchInterview: (id: string) => Promise<boolean>;
  getActiveInterview: () => Promise<void>;

  clearInterview: () => void;
};

export const useInterviewFlowStore = create<InterviewFlowStore>(
  (set, get) => ({
    interview: null,


    loading: false,
    startingInterview: false,

    activeInterviewId: null,
    activeInterviewTime: null,

    activeQuestionId: null,
    activeQuestionType: "none",

    setActiveQuestionId: (id: string, type: "dsa" | "sysDes" | "case" | "none") => {
      set({ activeQuestionId: id, activeQuestionType: type });
    },

    startInterview: async (id) => {
      set({ startingInterview: true });

      try {
        const res = await axiosInstance.post(
          `/interviewflow/${id}/start`
        );

        toast.success(
          res.data.message || "Interview started"
        );

        get().getActiveInterview();

        return true;
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
          "Failed to start interview"
        );

        return false;
      } finally {
        set({ startingInterview: false });
      }
    },

    getRemainingTime: async (id) => {
      try {
        const res = await axiosInstance.get(
          `/interviewflow/${id}/time`
        );

        if (res.data.message) {
          toast.success(res.data.message);
        }
        set({ activeInterviewTime: res.data.remainingTime })

        return null;
      } catch (err: any) {
        // toast.error(
        //   err?.response?.data?.message ||
        //   "Failed to get remaining time"
        // );

        return null;
      }
    },

    fetchInterview: async (id) => {
      set({ loading: true });

      try {
        const res = await axiosInstance.get(
          `/interviewflow/${id}`
        );

        set({
          interview: res.data.interview,
        });

        return true
      } catch (err: any) {
        // toast.error(
        //   err?.response?.data?.message ||
        //   "Failed to fetch interview"
        // );
        return false
      } finally {
        set({ loading: false });
      }
    },

    getActiveInterview: async () => {
      set({ loading: true });
      try {
        const res = await axiosInstance.get(
          `/interviewflow/active`
        );

        set({
          activeInterviewId: res.data.interviewId,
          activeInterviewTime: res.data.remainingTime,
        });
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
          "Failed to get active interview"
        );
      } finally {
        set({ loading: false });
      }
    },

    clearInterview: () => {
      set({
        interview: null,
      });
    },
  })
);