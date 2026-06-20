"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Clock } from "lucide-react";
import { useInterviewFlowStore } from "@/store/useInterviewFlow";
import SystemDesignInterview from "@/components/SystemDesignInterview";

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();

  const {
    interview,
    loading,
    activeInterviewTime,
    fetchInterview,
    getRemainingTime,
    getActiveInterview,
  } = useInterviewFlowStore();


  const [displayTime, setDisplayTime] = useState(0);

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

    const interval = setInterval(() => {
      getRemainingTime(id);
    }, 30000);

    return () => clearInterval(interval);
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

      {/* BODY */}

      <div className="flex h-full flex-col md:flex-row no-scrollbar">
        {/* QUESTIONS PANEL */}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar">
          {/* DSA */}

          {interview.questions?.dsa?.map(
            (question: any, index: number) => (
              <div
                key={index}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <h2 className="text-2xl font-bold">
                  {question.title}
                </h2>

                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">
                    {question.difficulty}
                  </span>

                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">
                    {question.duration} mins
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-zinc-300">
                  {question.description}
                </p>

                {question.constraints?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-2 font-semibold">
                      Constraints
                    </h3>

                    <ul className="list-disc pl-5 text-zinc-400">
                      {question.constraints.map(
                        (constraint: string) => (
                          <li key={constraint}>
                            {constraint}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {question.example?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-2 font-semibold">
                      Examples
                    </h3>

                    {question.example.map(
                      (example: any, idx: number) => (
                        <div
                          key={idx}
                          className="mb-3 rounded-xl bg-black p-4"
                        >
                          <p>
                            <b>Input:</b> {example.input}
                          </p>

                          <p>
                            <b>Output:</b> {example.output}
                          </p>

                          {example.explanation && (
                            <p>
                              <b>Explanation:</b>{" "}
                              {example.explanation}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* SYSTEM DESIGN */}

          {interview.questions?.sysDes?.map(
            (question: any, index: number) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
              >
                <div className="border-b border-zinc-800 p-6">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {question.question}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">
                      {question.difficulty}
                    </span>

                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">
                      {question.duration} mins
                    </span>

                    {question.topics?.map(
                      (topic: string) => (
                        <span
                          key={topic}
                          className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400"
                        >
                          {topic}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="mb-3 text-lg font-semibold">
                    Description
                  </h3>

                  <p className="whitespace-pre-wrap leading-7 text-zinc-300">
                    {question.description}
                  </p>
                </div>

                {question.constraints && (
                  <div className="border-t border-zinc-800 p-6">
                    <h3 className="mb-3 text-lg font-semibold">
                      Constraints
                    </h3>

                    <div className="rounded-xl bg-black/40 p-4">
                      <p className="whitespace-pre-wrap text-zinc-300">
                        {question.constraints}
                      </p>
                    </div>
                  </div>
                )}

                {question.hints?.length > 0 && (
                  <div className="border-t border-zinc-800 p-6">
                    <h3 className="mb-3 text-lg font-semibold">
                      Hints
                    </h3>

                    <ul className="space-y-2">
                      {question.hints.map(
                        (hint: string, idx: number) => (
                          <li
                            key={idx}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-400"
                          >
                            {hint}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {question.followUp?.length > 0 && (
                  <div className="border-t border-zinc-800 p-6">
                    <h3 className="mb-3 text-lg font-semibold">
                      Follow Up Questions
                    </h3>

                    <ul className="space-y-2">
                      {question.followUp.map(
                        (item: string, idx: number) => (
                          <li
                            key={idx}
                            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-300"
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* CHAT PANEL */}

        <div
          className="
            h-[450px]
            border-t border-zinc-800
            bg-zinc-900
            shrink-0
            flex-1
            md:h-full
            md:w-[420px]
            md:border-t-0
            md:border-l
            no-scrollbar
          "
        >
          <SystemDesignInterview
            interviewId={id}
            question={interview.questions?.sysDes?.[0]}
          />
        </div>
      </div>
    </div>
  );
}