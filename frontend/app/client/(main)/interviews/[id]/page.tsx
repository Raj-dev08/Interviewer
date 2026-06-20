"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Clock3,
  FileText,
  Code2,
  Layers3,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInterviewStore } from "@/store/useInterview";
import { useInterviewFlowStore } from "@/store/useInterviewFlow";

const icons = {
  case: FileText,
  "dsa-only": Code2,
  system_design: Layers3,
  mixed: Sparkles,
};

const titles = {
  case: "Case Study",
  "dsa-only": "DSA",
  system_design: "System Design",
  mixed: "Mixed Interview",
};

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const {
    interview,
    loading,
    getInterview,
    cancelInterview,
  } = useInterviewStore();

  const { startInterview, startingInterview } = useInterviewFlowStore();

  useEffect(() => {
    if (params.id) {
      getInterview(params.id as string);
    }
  }, [params.id]);

  const handleStartInterview = async () => {
    if (!interview) return;

    const success = await startInterview(
      interview._id
    );

    if (success) {
      router.push(
        `/client/interviews/start/${interview._id}`
      );
    }
  };

  const handleCancel = async () => {
    if (!interview) return;

    const success = await cancelInterview(
      interview._id
    );

    if (success) {
      router.back();
    }
  };

  console.log(interview)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Interview not found
      </div>
    );
  }

  const Icon =
    icons[interview.type] || Sparkles;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-4xl">

        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-8 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">

          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl bg-white p-4 text-black">
              <Icon size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                {
                  titles[
                    interview.type
                  ]
                }
              </h1>

              <p className="mt-1 text-zinc-400">
                Mock interview session
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl border border-zinc-800 p-5">
              <div className="mb-2 flex items-center gap-2 text-zinc-400">
                <Clock3 size={16} />
                Duration
              </div>

              <div className="text-2xl font-bold">
                {interview.duration} mins
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 p-5">
              <div className="mb-2 text-zinc-400">
                Type
              </div>

              <div className="text-2xl font-bold">
                {
                  titles[
                    interview.type
                  ]
                }
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">

            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-red-900 bg-transparent text-red-400 hover:bg-red-950"
            >
              Cancel Interview
            </Button>

            <Button
              onClick={handleStartInterview}
              disabled={startingInterview}
              className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold px-6 py-2 shadow-lg shadow-white/10 transition-all cursor-pointer"
            >
              {startingInterview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Interview"
              )}
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}