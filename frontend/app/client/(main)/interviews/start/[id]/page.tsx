"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Clock } from "lucide-react";
import { useInterviewFlowStore } from "@/store/useInterviewFlow";
import SystemDesignSection from "@/components/SystemDesignSection";
import CaseStudySection from "@/components/CaseStudySection";
import InterviewNavigation from "@/components/InterviewNavigation";
import DSASection from "@/components/DSAInterview";

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();

  const {
    interview,
    loading,
    activeInterviewTime,
    setActiveQuestionId,
    fetchInterview,
    getRemainingTime,
  } = useInterviewFlowStore();



  const [displayTime, setDisplayTime] = useState(0);

  const [activeType, setActiveType] = useState<"sysDes" | "case" | "dsa">("sysDes");
  const [selectedQuestion, setSelectedQuestion] =
    useState<{
      question: any;
      source: "sysDes" | "case" | "dsa";
    } | null>(null);


  useEffect(() => {
    setDisplayTime(activeInterviewTime || 0);
  }, [activeInterviewTime]);

  useEffect(() => {
    if (!displayTime) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [displayTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(
        secs
      ).padStart(2, "0")}`;
    }

    return `${mins}:${String(secs).padStart(2, "0")}`;
  };


  useEffect(() => {
    if (!id) return;

    fetchInterview(id);
    getRemainingTime(id);

    // const interval = setInterval(() => {
    //   getRemainingTime(id);
    // }, 30000);

    // return () => clearInterval(interval);

    //think of a better thing cuz this might hang
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Interview not found
      </div>
    );
  }

  // console.log(interview)

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col no-scrollbar">

      {/* TOP BAR */}

      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold capitalize">
            {interview.type}
          </h1>

          <p className="text-sm text-zinc-500">
            Status: {interview.status}
          </p>


        </div>

        <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-green-400">
          <Clock className="h-4 w-4 animate-pulse" />

          <span className="font-mono text-sm font-bold tracking-wider">
            {formatTime(displayTime)}
          </span>
        </div>
      </div>

      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <InterviewNavigation
          interview={interview}
          activeType={activeType}
          setActiveType={setActiveType}
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
          setActiveQuestionId={setActiveQuestionId}
        />

      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {!selectedQuestion ? (
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-64 rounded bg-zinc-800" />
                <div className="h-4 w-full rounded bg-zinc-800" />
                <div className="h-4 w-5/6 rounded bg-zinc-800" />
                <div className="h-4 w-4/6 rounded bg-zinc-800" />

                <div className="mt-8 h-32 rounded-xl bg-zinc-800" />
              </div>

              <div className="mt-8 text-center text-zinc-500">
                Select a question to begin
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeType === "dsa" && selectedQuestion.source == "dsa" && (
              <DSASection
                key={selectedQuestion.question._id}
                interviewId={id}
                question={selectedQuestion.question}
              />
            )}

            {activeType === "sysDes" && selectedQuestion.source == "sysDes" && (
              <SystemDesignSection
                key={selectedQuestion.question._id}
                interviewId={id}
                question={selectedQuestion.question}
              />
            )}

            {activeType === "case" && selectedQuestion.source == "case" && (
              <CaseStudySection
                key={selectedQuestion.question._id}
                interviewId={id}
                question={selectedQuestion.question}
              />
            )}
          </>
        )}
      </div>


    </div>
  );
}