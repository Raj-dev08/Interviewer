"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export type CaseStudy = {
  _id: string;

  title: string;
  description: string;

  difficulity: string;
  duration: number;

  domain: string;
  type: string;

  previousContext: string;
  goal: string;

  expectedApproach: string[];

  data?: {
    label: string;
    value: string;
  }[];

  sampleSolution: {
    answer: string;
    keyPoints: string[];
  };

  hints?: string[];
  followUps?: string[];
  constraints?: string[];

  evaluation: {
    category: string;
    description: string;
    weight: number;
  }[];

  answerFormat?: string;

  addedBy: {
    _id: string;
    name?: string;
    email?: string;
  };

  createdAt?: string;
  updatedAt?: string;
};

type CaseStudyStore = {
  caseStudy: CaseStudy | null;
  caseStudies: CaseStudy[];

  loading: boolean;

  fetchCaseStudy: (id: string) => Promise<void>;
  fetchAllCaseStudies: () => Promise<void>;

  createCaseStudy: (payload: any) => Promise<boolean>;
  deleteCaseStudy: (id: string) => Promise<boolean>;

  clearCaseStudy: () => void;
};

export const useCaseStudyStore = create<CaseStudyStore>((set, get) => ({
  caseStudy: null,
  caseStudies: [],

  loading: false,

  // ---------------- GET SINGLE ----------------
  fetchCaseStudy: async (id) => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["case-study", id],
        queryFn: async () => {
          const res = await axiosInstance.get(`/case/${id}`);
          return res.data.caseStudy || res.data.CaseStudy;
        },
      });

      set({ caseStudy: data });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch case study"
      );
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- GET ALL (OWNER) ----------------
  fetchAllCaseStudies: async () => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["case-studies"],
        queryFn: async () => {
          const res = await axiosInstance.get("/case/owner/getAll");
          return res.data.caseStudies;
        },
      });

      set({ caseStudies: data });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch case studies"
      );
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- CREATE ----------------
  createCaseStudy: async (payload) => {
    set({ loading: true });

    try {
      await axiosInstance.post("/case/create", payload);

      queryClient.invalidateQueries({
        queryKey: ["case-studies"],
      });

      toast.success("Case study created");
      return true;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to create case study"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- DELETE ----------------
  deleteCaseStudy: async (id) => {
    set({ loading: true });

    try {
      await axiosInstance.delete(`/case/delete/${id}`);

      queryClient.invalidateQueries({
        queryKey: ["case-studies"],
      });

      queryClient.removeQueries({
        queryKey: ["case-study", id],
      });

      get().fetchAllCaseStudies();

      toast.success("Case study deleted");

      return true;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to delete case study"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  clearCaseStudy: () => {
    set({ caseStudy: null });
  },
}));