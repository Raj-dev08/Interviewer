"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { useInterviewStore } from "@/store/useInterview";
import { Button } from "@/components/ui/button";

export default function InterviewsPage() {
  const {
    interviews,
    loading,
    getAllInterviews,
  } = useInterviewStore();

  useEffect(() => {
    getAllInterviews();
  }, [getAllInterviews]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold">
              Interviews
            </h1>

            <p className="mt-2 text-zinc-400">
              Manage your scheduled mock interviews.
            </p>
          </div>

          <Link href="/client/interviews/create">
            <Button className="rounded-2xl bg-white text-black hover:bg-zinc-200">
              <Plus className="mr-2 h-4 w-4" />
              Create Interview
            </Button>
          </Link>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : interviews.length === 0 ? (

          /* EMPTY STATE */
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-16 text-center">
            <h2 className="text-2xl font-semibold">
              No Interviews Yet
            </h2>

            <p className="mt-3 text-zinc-400">
              Create your first interview and start practicing.
            </p>

            <Link href="/client/interviews/create">
              <Button className="mt-6 rounded-xl bg-white text-black hover:bg-zinc-200">
                <Plus className="mr-2 h-4 w-4" />
                Create Interview
              </Button>
            </Link>
          </div>

        ) : (

          /* INTERVIEWS */
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {interviews.map((interview) => (
              <Link
                key={interview._id}
                href={`/client/interviews/${interview._id}`}
              >
                <div className="group h-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/80">

                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold capitalize">
                        {interview.type.replace("-", " ")}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        Mock Interview
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        interview.status === "scheduled"
                          ? "bg-green-500/10 text-green-400"
                          : interview.status === "cancelled"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {interview.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">
                        Duration
                      </span>

                      <span className="font-medium">
                        {interview.duration} mins
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">
                        Type
                      </span>

                      <span className="capitalize">
                        {interview.type.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-zinc-800 pt-4 text-sm text-zinc-400 transition group-hover:text-white">
                    View Interview →
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}