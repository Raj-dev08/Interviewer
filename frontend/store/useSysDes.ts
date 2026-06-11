"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";


type CorrectAnswerFlow = {
  title: string;
  approach: string;
  step: number;
};


type Evaluation = {
  title: string;
  description: string;
  evalType: "boolean" | "approx";
  weight: number;
};


export type SystemDesignQuestion = {
  _id: string;

  question: string;
  description: string;
  constraints: string;

  difficulty: "easy" | "medium" | "hard";
  duration: number;

  topics: string[];
  companyTags?: string[];

  isPremium: boolean;

  correctAnswerFlow: CorrectAnswerFlow[];

  followUp?: string[];
  hints?: string[];

  evaluation: Evaluation[];

  addedBy: {
    _id: string;
    name?: string;
    email?: string;
  };

  rating: number;
  totalRatings: number;

  createdAt?: string;
  updatedAt?: string;
};


type SystemDesignStore = {
  question: SystemDesignQuestion | null;
  questions: SystemDesignQuestion[];
  loading: boolean;


  fetchQuestion: (id:string)=>Promise<void>;
  fetchAllAdminQuestions:()=>Promise<void>;
  createQuestion:(data:any)=>Promise<boolean>;
  deleteQuestion:(id:string)=>Promise<boolean>;
  clearQuestion:()=>void;
};


export const useSystemDesignStore = create<SystemDesignStore>((set,get)=>({
  question:null,
  questions:[],
  loading:false,



  // ---------------- GET ONE ----------------
  fetchQuestion: async(id)=>{
    set({loading:true});
    try{
      const data = await queryClient.fetchQuery({
        queryKey:["sysdes-question",id],
        queryFn:async()=>{
          const res = await axiosInstance.get(
            `/sysdes/${id}`
          );
          return res.data.question;
        }
      });
      set({
        question:data
      });
    }catch(err:any){
      toast.error(
        err?.response?.data?.message ||
        "Failed to fetch question"
      );
    }finally{
      set({loading:false});
    }

  },

  // ---------------- ADMIN ALL ----------------
  fetchAllAdminQuestions: async()=>{
    set({loading:true});
    try{
      const data = await queryClient.fetchQuery({
        queryKey:["sysdes-admin-questions"],
        queryFn:async()=>{
          const res =
          await axiosInstance.get(
            "/sysdes/owner/getAll"
          );
          return res.data.questions;
        }
      });
      set({
        questions:data
      });
    }catch(err:any){
      toast.error(
        err?.response?.data?.message ||
        "Failed to fetch questions"
      );
    }finally{
      set({loading:false});
    }

  },

  // ---------------- CREATE ----------------
  createQuestion: async(payload)=>{
    set({loading:true});
    try{
      await axiosInstance.post(
        "/sysdes/create",
        payload
      );
      queryClient.invalidateQueries({
        queryKey:["sysdes-admin-questions"]
      });
      toast.success(
        "System design question created"
      );
      return true;
    }catch(err:any){
      toast.error(
        err?.response?.data?.message ||
        "Failed to create question"
      );
      return false;
    }finally{
      set({loading:false});
    }
  },

  // ---------------- DELETE ----------------

  deleteQuestion: async(id)=>{
    set({loading:true});
    try{
      await axiosInstance.delete(
        `/sysdes/delete/${id}`
      );

      queryClient.invalidateQueries({
        queryKey:["sysdes-admin-questions"]
      });

      queryClient.removeQueries({
        queryKey:["sysdes-question",id]
      });

      get().fetchAllAdminQuestions();

      toast.success(
        "Question deleted"
      );
      return true;
    }catch(err:any){
      toast.error(
        err?.response?.data?.message ||
        "Failed to delete question"
      );
      return false;
    }finally{
      set({loading:false});
    }
  },

  clearQuestion:()=>{
    set({
      question:null
    });
  }
}));