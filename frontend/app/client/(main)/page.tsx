"use client";

import {
  Bell,
  CalendarDays,
  BarChart3,
  Users,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/store/useNotification";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
  },[])
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">
              Interview Dashboard
            </h1>
          </div>

          <button
            onClick={() => router.push("/client/notifications")}
            className="relative rounded-xl p-2 transition hover:bg-zinc-900"
          >
            <Bell className="h-5 w-5 text-zinc-300" />
            <span className="absolute right-1 top-1 text-xs text-red-500 font-bold" >
              {unreadCount}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {/* HERO */}
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
          <h1 className="text-4xl font-bold">
            Welcome Back
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Create interviews, review candidate performance,
            track hiring progress, and analyze results from a
            single dashboard.
          </p>

          <button
            onClick={() => router.push("/client/interviews")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
          >
            View Interviews
            <ArrowRight size={18} />
          </button>
        </div>

        {/* QUICK STATS */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <CalendarDays className="mb-4 h-8 w-8 text-zinc-400" />

            <h3 className="text-sm text-zinc-500">
              Interviews
            </h3>

            <p className="mt-2 text-3xl font-bold">
              --
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Scheduled & completed
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <Users className="mb-4 h-8 w-8 text-zinc-400" />

            <h3 className="text-sm text-zinc-500">
              Candidates
            </h3>

            <p className="mt-2 text-3xl font-bold">
              --
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Total participants
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <BarChart3 className="mb-4 h-8 w-8 text-zinc-400" />

            <h3 className="text-sm text-zinc-500">
              Analytics
            </h3>

            <p className="mt-2 text-3xl font-bold">
              --
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Performance insights
            </p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold">
              Interview Management
            </h2>

            <p className="mt-3 text-zinc-400">
              Create and manage technical interviews,
              configure questions, and review candidate
              responses.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold">
              AI Analysis
            </h2>

            <p className="mt-3 text-zinc-400">
              Get automated feedback, performance scoring,
              and detailed candidate evaluation reports.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}