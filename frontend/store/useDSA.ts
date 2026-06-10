"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

type Example = {
  input: string;
  output: string;
  explanation?: string;
};

type TestCase = {
  input: string;
  output: string;
  isHidden?: boolean;
};

type CodeInAllLangs = {
  lang: string;
  starterCode: string;
  solutionCode: string;
};

type CorrectAnswer = {
  language: string;
  code: string;
};

type ValidationType = "exact" | "custom";

export type DSAQuestion = {
  _id: string;

  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;

  topics: string[];
  companyTags?: string[];

  isPremium: boolean;

  example: Example[];
  testCases: TestCase[];

  availableLanguages: string[];

  codeInAllLangs: CodeInAllLangs[];

  maxMemory: number;
  maxTime: number;

  constraints?: string[];
  followUp?: string[];
  hints?: string[];

  addedBy: {
        _id: string;
        name?: string;
        email?: string;
  } ;

  rating: number;
  totalRatings: number;

  correctAnswer: CorrectAnswer;

  validationType: ValidationType;

  validationCode?: {
    language?: string;
    code?: string;
  };

  

  createdAt?: string;
  updatedAt?: string;
};

type DsaStore = {
  question: DSAQuestion | null;
  questions: DSAQuestion[];

  loading: boolean;

  fetchQuestion: (id: string) => Promise<void>;
  fetchAdminQuestion: (id: string) => Promise<void>;
  fetchAllAdminQuestions: () => Promise<void>;

  createQuestion: (data: any) => Promise<boolean>;
  addTestCases: (id: string, testCases: TestCase[]) => Promise<boolean>;
  deleteQuestion: (id: string) => Promise<boolean>;

  clearQuestion: () => void;
};

export const useDsaStore = create<DsaStore>((set, get) => ({
  question: null,
  questions: [],
  loading: false,

  // ---------------- PUBLIC QUESTION (Interview only or post interview) ----------------
  fetchQuestion: async (id) => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["dsa-question", id],
        queryFn: async () => {
          const res = await axiosInstance.get(`/dsa/question/${id}`);
          return res.data.question;
        },
      });

      set({ question: data });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch question");
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- ADMIN QUESTION (FULL DATA) ----------------
  fetchAdminQuestion: async (id) => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["dsa-admin-question", id],
        queryFn: async () => {
          const res = await axiosInstance.get(`/dsa/admin/question/${id}`);
          return res.data.question;
        },
      });

      set({ question: data });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch admin question");
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- ALL QUESTIONS (ADMIN ONLY) ----------------
  fetchAllAdminQuestions: async () => {
    set({ loading: true });

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["dsa-admin-questions"],
        queryFn: async () => {
          const res = await axiosInstance.get(`/dsa/admin/questions`);
          return res.data.questions;
        },
      });

      set({ questions: data });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch questions");
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- CREATE QUESTION ----------------
  createQuestion: async (payload) => {
    set({ loading: true });

    try {
      await axiosInstance.post("/dsa/create", payload);

      queryClient.invalidateQueries({ queryKey: ["dsa-admin-questions"] });

      toast.success("Question created");
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create question");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- ADD TEST CASES ----------------
  addTestCases: async (id, testCases) => {
    set({ loading: true });

    try {
      await axiosInstance.post(`/dsa/${id}/testcases`, {
        testCases,
      });

      queryClient.invalidateQueries({ queryKey: ["dsa-admin-question", id] });
      queryClient.invalidateQueries({ queryKey: ["dsa-question", id] });

      toast.success("Test cases added");
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add test cases");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- DELETE ----------------
  deleteQuestion: async (id) => {
    set({ loading: true });

    try {
      await axiosInstance.delete(`/dsa/${id}`);

      queryClient.invalidateQueries({ queryKey: ["dsa-admin-questions"] });
      queryClient.removeQueries({ queryKey: ["dsa-question", id] });
      queryClient.removeQueries({ queryKey: ["dsa-admin-question", id] });

      get().fetchAllAdminQuestions();

      toast.success("Question deleted");
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete question");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  clearQuestion: () => {
    set({ question: null });
  },
}));