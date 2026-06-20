"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  CreditCard,
  FileQuestion,
  LayoutDashboard,
  Users,
  Crown,
  Logs,
  Timer,
  PlayCircle,
} from "lucide-react";

import { useInterviewFlowStore } from "@/store/useInterviewFlow";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuth";

import SidebarItem from "./SideBarItem";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const { user } = useAuthStore();
  const {
    activeInterviewId,
    activeInterviewTime,
    getActiveInterview,
  } = useInterviewFlowStore();

  const [displayTime, setDisplayTime] = useState(0);

  useEffect(() => {
    getActiveInterview();
  }, []);

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

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <aside className="hidden w-72 flex-col border-r border-zinc-800 bg-zinc-900/50 md:flex">

      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-2xl font-bold">
          MockIT
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          AI Interview Platform
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">

        {!isAdminRoute ? (
          <>
            <Link href="/client">
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                active={pathname === "/client"}
              />
            </Link>

            <Link href="/client/interviews">
              <SidebarItem
                icon={<Logs size={18} />}
                label="Interviews"
                active={pathname.startsWith("/client/interviews")}
              />
            </Link>

            <Link href="/client/plans">
              <SidebarItem
                icon={<CreditCard size={18} />}
                label="Plans"
                active={pathname.startsWith("/client/plans")}
              />
            </Link>

            <Link href="/client/profile">
              <SidebarItem
                icon={<User size={18} />}
                label="Profile"
                active={pathname.startsWith("/client/profile")}
              />
            </Link>

            {user?.isOwner && (
              <Link href="/admin">
                <SidebarItem
                  icon={<Crown size={18} />}
                  label="Go To Admin"
                  active={false}
                />
              </Link>
            )}
          </>
        ) : (
          <>
            <Link href="/admin">
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                label="Admin Dashboard"
                active={pathname === "/admin"}
              />
            </Link>

            <Link href="/admin/questions">
              <SidebarItem
                icon={<FileQuestion size={18} />}
                label="Manage Questions"
                active={pathname.startsWith("/admin/questions")}
              />
            </Link>

            <Link href="/admin/plans">
              <SidebarItem
                icon={<CreditCard size={18} />}
                label="Manage Plans"
                active={pathname.startsWith("/admin/plans")}
              />
            </Link>

            <Link href="/client">
              <SidebarItem
                icon={<Users size={18} />}
                label="Back To Client"
                active={false}
              />
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-xl bg-zinc-800 p-4">
          <p className="text-sm font-medium">
            Current Plan
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {user?.isPaid ? "Premium" : "Free Tier"}
          </p>
        </div>
      </div>

      {activeInterviewId && pathname !== `/client/interviews/start/${activeInterviewId}` && (
        <div className="border-b border-zinc-800 p-4">
          <Link
            href={`/client/interviews/start/${activeInterviewId}`}
          >
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 transition hover:bg-green-500/15">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                  <PlayCircle size={18} />
                </div>

                <div>
                  <p className="font-medium text-white">
                    Active Interview
                  </p>

                  <p className="text-xs text-zinc-400">
                    Click to continue
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-zinc-950/40 px-4 py-3 text-green-400">
                <Timer className="h-4 w-4 animate-pulse" />

                <span className="font-mono text-lg font-bold tracking-widest">
                  {formatTime(displayTime)}
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}