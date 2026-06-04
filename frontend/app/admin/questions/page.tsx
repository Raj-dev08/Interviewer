"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDsaStore } from "@/store/useDSA";
import { Loader2, BookOpen, Layers, FileText, Plus } from "lucide-react";

type Tab = "dsa" | "system-design" | "case-study";

export default function AdminContentPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("dsa");

  const {
    questions,
    loading,
    fetchAllAdminQuestions,
  } = useDsaStore();

  useEffect(() => {
    if (tab === "dsa") {
      fetchAllAdminQuestions();
    }
  }, [tab]);

  const handleCreate = () => {
    router.push(`/admin/create-${tab}`);
  };

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
                <div
                  key={q._id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <h2 className="text-xl font-semibold">
                    {q.title}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                    {q.description}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
                      {q.difficulty}
                    </span>

                    <span className="text-xs px-3 py-1 rounded-full bg-zinc-800">
                      {q.duration} min
                    </span>
                  </div>
                </div>
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
          <div className="text-zinc-400 text-sm">
            System Design module not connected yet.
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