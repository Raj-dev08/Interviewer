"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "./useAuth";

export type Interview = {
  _id: string;
  type: "case" | "dsa-only" | "system_design" | "mixed";
  status: string;
  duration: number;
};

type InterviewStore = {
  interview: Interview | null;
  interviews: Interview[];
  loading: boolean;

  createInterview: (type: Interview["type"]) => Promise<boolean>;
  getInterview: (id: string) => Promise<void>;
  getAllInterviews: () => Promise<void>;
  cancelInterview: (id: string) => Promise<boolean>;
  clearInterview: () => void;

  subscribetoInterviews: () => void;
};

export const useInterviewStore = create<InterviewStore>((set,get) => ({
  interview: null,
  interviews: [],
  loading: false,

  createInterview: async (type) => {
    set({ loading: true });

    try {
      await axiosInstance.post("/interview/create", { type });

      queryClient.invalidateQueries({
        queryKey: ["interviews"],
      });

      toast.success("Interview creation queued");
      return true;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to create interview"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  getInterview: async (id) => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["interview", id],
        queryFn: async () => {
          const res = await axiosInstance.get(
            `/interview/get/${id}`
          );

          return res.data.interview;
        },
      });

      set({ interview: data });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to fetch interview"
      );
    } finally {
      set({ loading: false });
    }
  },

  getAllInterviews: async () => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["interviews"],
        queryFn: async () => {
          const res = await axiosInstance.get(
            "/interview/get-all"
          );

          return res.data.interviews;
        },
      });

      set({ interviews: data });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to fetch interviews"
      );
    } finally {
      set({ loading: false });
    }
  },

  subscribetoInterviews: () => {
    const { socket } = useAuthStore.getState();

    if (!socket) return;

    socket.off("interview_created");

    socket.on("interview_created", (data: any) => {
      set((state) => ({
        interviews: [data.interview, ...state.interviews],
      }))
    })
  },

  cancelInterview: async (id) => {
    set({ loading: true });

    try {
      await axiosInstance.patch(
        `/interview/cancel/${id}`
      );

      queryClient.invalidateQueries({
        queryKey: ["interviews"],
      });

      queryClient.removeQueries({
        queryKey: ["interview", id],
      });

      toast.success("Interview cancelled");

      return true;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to cancel interview"
      );

      return false;
    } finally {
      set({ loading: false });
    }
  },



  clearInterview: () => {
    set({
      interview: null,
    });
  },
}));