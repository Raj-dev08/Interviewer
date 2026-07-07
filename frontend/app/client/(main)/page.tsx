"use client";

import {
  Bell,
  CalendarDays,
  Percent,
  ArrowRight,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/store/useNotification";
import { useEffect } from "react";
import { useInterviewStore } from "@/store/useInterview";

export default function HomePage() {
  const router = useRouter();

  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { interviews, getAllInterviews } = useInterviewStore();

  useEffect(() => {
    fetchUnreadCount();
    getAllInterviews();
  }, []);

  const completed = interviews.filter(
    (i) => i.status === "finished"
  ).length;

  const completionRate =
    interviews.length === 0
      ? 0
      : ((completed / interviews.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            {/* <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Dashboard
            </p> */}
            <h1 className="text-xl font-bold">Mock IT</h1>
          </div>

          <button
            onClick={() => router.push("/client/notifications")}
            className="relative rounded-xl border border-zinc-800 bg-zinc-900 p-2 transition-all duration-300 hover:scale-105 hover:bg-zinc-800"
          >
            <Bell className="h-5 w-5 text-zinc-300" />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
              AI Powered Hiring
            </span>

            <h1 className="mt-5 text-5xl font-bold tracking-tight">
              Welcome Back 👋
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-7 text-zinc-400">
              Manage interviews, review AI generated reports, monitor
              candidate performance, and streamline your hiring workflow
              from one powerful dashboard.
            </p>

            <button
              onClick={() => router.push("/client/interviews")}
              className="group mt-8 flex items-center cursor-pointer gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-zinc-200"
            >
              View Interviews

              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Total */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/40">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
              <CalendarDays className="h-7 w-7 text-indigo-400" />
            </div>

            <p className="text-sm text-zinc-500">Total Interviews</p>

            <h2 className="mt-2 text-4xl font-bold">
              {interviews.length}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Scheduled interviews
            </p>
          </div>

          {/* Completed */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/40">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>

            <p className="text-sm text-zinc-500">
              Completed Interviews
            </p>

            <h2 className="mt-2 text-4xl font-bold">{completed}</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Successfully finished
            </p>
          </div>

          {/* Completion */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/40">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
              <Percent className="h-7 w-7 text-orange-400" />
            </div>

            <p className="text-sm text-zinc-500">
              Completion Rate
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              {completionRate}%
            </h2>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1">
            <h2 className="text-2xl font-semibold">
              Interview Management
            </h2>

            <p className="mt-4 leading-7 text-zinc-400">
              Create, schedule and manage interviews effortlessly.
              Configure technical rounds, assign candidates and
              monitor interview progress from a centralized dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1">
            <h2 className="text-2xl font-semibold">
              AI Candidate Analysis
            </h2>

            <p className="mt-4 leading-7 text-zinc-400">
              Receive AI generated evaluations, coding analysis,
              communication insights and comprehensive candidate
              reports to make faster hiring decisions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}