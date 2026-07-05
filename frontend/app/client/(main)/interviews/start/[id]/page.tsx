"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Clock, TriangleAlert } from "lucide-react";
import { useInterviewFlowStore } from "@/store/useInterviewFlow";
import SystemDesignSection from "@/components/SystemDesignSection";
import CaseStudySection from "@/components/CaseStudySection";
import InterviewNavigation from "@/components/InterviewNavigation";
import DSASection from "@/components/DSAInterview";
import InterviewFinishedScreen from "@/components/InterviewFinished";
import { Button } from "@/components/ui/button";

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();

  const {
    interview,
    loading,
    activeInterviewTime,
    setActiveQuestionId,
    fetchInterview,
    getRemainingTime,
    finishInterview
  } = useInterviewFlowStore();



  const [displayTime, setDisplayTime] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);

  const [activeType, setActiveType] = useState<"sysDes" | "case" | "dsa">("sysDes");
  const [selectedQuestion, setSelectedQuestion] =
    useState<{
      question: any;
      source: "sysDes" | "case" | "dsa";
    } | null>(null);


  useEffect(() => {
    if (activeInterviewTime && activeInterviewTime <= 2) {
      setInterviewEnded(true)
    }
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

    const init = async () => {
      const success = await fetchInterview(id);
      if (!success) {
        setInterviewEnded(true)
      }
    }

    init()

    getRemainingTime(id);

  }, [id]);

  // console.log(displayTime, activeInterviewTime)

  const lastPollRef = useRef<number>(0);

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      const now = Date.now();

      let pollEvery = 600000; // >10 min -> every 10 min

      if (displayTime <= 10) {
        pollEvery = 5000; // every 5 sec
      } else if (displayTime <= 60) {
        pollEvery = 20000; // every 20 sec (~3 polls)
      } else if (displayTime <= 120) {
        pollEvery = 30000; // every 30 sec (~4 polls)
      } else if (displayTime <= 300) {
        pollEvery = 60000; // every 1 min
      } else if (displayTime <= 600) {
        pollEvery = 120000; // every 2 min
      }

      if (now - lastPollRef.current >= pollEvery) {
        lastPollRef.current = now;
        getRemainingTime(id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [id, displayTime, getRemainingTime]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!interview && !interviewEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        Interview not found
      </div>
    );
  }

  if (interviewEnded) {
    return (
      <InterviewFinishedScreen
        onGoDashboard={() => (window.location.href = "/client")}
        onReload={() => window.location.reload()}
      />
    )
  }

  // console.log(interview)

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col no-scrollbar">

      {/* TOP BAR */}

      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold capitalize">
            {interview?.type}
          </h1>

          <p className="text-sm text-zinc-500">
            Status: {interview?.status}
          </p>


        </div>
        <div className="flex gap-2">
          <button
            className="bg-red-600 px-2 py-1 text-sm rounded-xl cursor-pointer text-white hover:bg-red-700 hover:opacity-90 transition-all duration-300"
            onClick={() => {
              finishInterview(id)
              setInterviewEnded(true)
            }
            }>
            Finish Interview
          </button>
          {displayTime < 30 && (
            <div className="flex items-center gap-2 border border-orange-500/20 bg-orange-500/10 text-orange-400 px-3 py-2 rounded-xl">
              <TriangleAlert />
              <p>
                Interview will end in {displayTime - 4} secs
              </p>
            </div>
          )}
          <div className={`flex items-center gap-2 rounded-xl border ${displayTime < 10 ? `border-red-500/20 bg-red-500/10 text-red-400` : `border-green-500/20 bg-green-500/10 text-green-400`} px-3 py-2 `}>
            <Clock className="h-4 w-4 animate-pulse" />

            <span className="font-mono text-sm font-bold tracking-wider">
              {formatTime(displayTime)}
            </span>
          </div>
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
            {activeType === "dsa" && selectedQuestion.source == "dsa" && displayTime > 4 && (
              <DSASection
                key={selectedQuestion.question._id}
                interviewId={id}
                question={selectedQuestion.question}
              />
            )}

            {activeType === "sysDes" && selectedQuestion.source == "sysDes" && displayTime > 4 && (
              <SystemDesignSection
                key={selectedQuestion.question._id}
                interviewId={id}
                question={selectedQuestion.question}
              />
            )}

            {activeType === "case" && selectedQuestion.source == "case" && displayTime > 4 && (
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