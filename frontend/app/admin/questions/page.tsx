"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDsaStore } from "@/store/useDSA";
import { useAuthStore } from "@/store/useAuth";
import { Loader2, BookOpen, Layers, FileText, Plus } from "lucide-react";
import DsaQuestionCard from "@/components/DsaQuestionCard";
import SystemDesignQuestionCard from "@/components/SystemDesignQuestionCard";
import { useSystemDesignStore } from "@/store/useSysDes";

type Tab = "dsa" | "system-design" | "case-study";

export default function AdminContentPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("dsa");

  const {
    questions,
    loading,
    fetchAllAdminQuestions,
    deleteQuestion
  } = useDsaStore();

  const { 
    questions: systemDesignQuestions , 
    loading: systemDesignLoading, 
    fetchAllAdminQuestions: fetchAllSystemDesignQuestions,
    deleteQuestion: deleteSystemDesignQuestion
  } = useSystemDesignStore()

  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!user) checkAuth();
    if (tab === "dsa") {
      fetchAllAdminQuestions();
      
    }
    if (tab === "system-design"){
      fetchAllSystemDesignQuestions();
    }
  }, [tab]);

  const handleCreate = () => {
    router.push(`/admin/create-${tab}`);
  };

  // console.log("Admin Questions Page Rendered. Current tab:", tab);
  // console.log("Questions data:", questions);
  // console.log("System Design Questions data:", systemDesignQuestions);


  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-6xl">

        {/* TABS */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-800">

          <div className="flex gap-3">

            <button
              onClick={() => setTab("dsa")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === "dsa"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <BookOpen size={16} />
              DSA
            </button>

            <button
              onClick={() => setTab("system-design")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === "system-design"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Layers size={16} />
              System Design
            </button>

            <button
              onClick={() => setTab("case-study")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === "case-study"
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <FileText size={16} />
              Case Study
            </button>
          </div>

          {/* CREATE BUTTON */}
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition"
          >
            <Plus size={16} />
            Create {tab}
          </button>
        </div>

        {/* CONTENT */}
        {tab === "dsa" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">
                DSA Questions
              </h1>

              {loading && (
                <Loader2 className="animate-spin" />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {questions.map((q: any) => (
                <DsaQuestionCard
                  key={q._id}
                  question={q}
                  user={user}
                  deleteQuestion={deleteQuestion}
                />
              ))}
            </div>

            {questions.length === 0 && !loading && (
              <div className="text-zinc-500 text-sm mt-10">
                No DSA questions found.
              </div>
            )}
          </div>
        )}

        {/* PLACEHOLDERS */}
        {tab === "system-design" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">
                System Design Questions
              </h1>

              {systemDesignLoading && (
                <Loader2 className="animate-spin" />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {systemDesignQuestions.map((q) => (
                <SystemDesignQuestionCard
                  key={q._id}
                  question={q}
                  user={user}
                  deleteQuestion={deleteSystemDesignQuestion}
                />
              ))}
            </div>

            {systemDesignQuestions.length === 0 && !systemDesignLoading && (
              <div className="text-zinc-500 text-sm mt-10">
                No system design questions found.
              </div>
            )}
          </div>
        )}

        {tab === "case-study" && (
          <div className="text-zinc-400 text-sm">
            Case Study module not connected yet.
          </div>
        )}

      </div>
    </div>
  );
}