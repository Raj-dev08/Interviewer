"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Code2,
  Layers3,
  Sparkles,
  Loader2,
} from "lucide-react";

import { useInterviewStore } from "@/store/useInterview";
import { Button } from "@/components/ui/button";

type InterviewType =
  | "case"
  | "dsa-only"
  | "system_design"
  | "mixed";

const interviewTypes = [
  {
    value: "dsa-only",
    title: "DSA",
    description:
      "Practice data structures, algorithms and coding interview questions.",
    icon: Code2,
  },
  {
    value: "system_design",
    title: "System Design",
    description:
      "Design scalable systems, APIs, databases and distributed architectures.",
    icon: Layers3,
  },
  {
    value: "case",
    title: "Case Study",
    description:
      "Solve product, business and analytical case studies.",
    icon: FileText,
  },
  {
    value: "mixed",
    title: "Mixed",
    description:
      "A combination of DSA and System Design questions.",
    icon: Sparkles,
  },
] as const;

export default function CreateInterviewPage() {
  const router = useRouter();

  const { createInterview, loading } =
    useInterviewStore();

  const [selectedType, setSelectedType] =
    useState<InterviewType | null>(null);

  const handleCreate = async () => {
    if (!selectedType) return;

    const success =
      await createInterview(selectedType);

    if (success) {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-10 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl font-bold">
            Create Interview
          </h1>

          <p className="mt-2 text-zinc-400">
            Select the interview type you want
            to practice.
          </p>
        </div>

        {/* TYPES */}
        <div className="grid gap-5 md:grid-cols-2">
          {interviewTypes.map((type) => {
            const Icon = type.icon;

            const active =
              selectedType === type.value;

            return (
              <button
                key={type.value}
                onClick={() =>
                  setSelectedType(type.value)
                }
                className={`rounded-3xl border p-6 text-left transition-all ${
                  active
                    ? "border-white bg-zinc-900"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                }`}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className={`rounded-xl p-3 ${
                      active
                        ? "bg-white text-black"
                        : "bg-zinc-800"
                    }`}
                  >
                    <Icon size={22} />
                  </div>

                  <h2 className="text-xl font-semibold">
                    {type.title}
                  </h2>
                </div>

                <p className="text-sm text-zinc-400">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* ACTIONS */}
        <div className="mt-10 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() =>
              router.back()
            }
            className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
          >
            Cancel
          </Button>

          <Button
            disabled={!selectedType || loading}
            onClick={handleCreate}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Interview"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}