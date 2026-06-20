"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Home,
  Logs,
  FileQuestion,
  User,
  Crown,
  CreditCard,
  Users,
  Timer,
  PlayCircle
} from "lucide-react";

import { useAuthStore } from "@/store/useAuth";
import { useInterviewFlowStore } from "@/store/useInterviewFlow";

function BottomItem({
  icon,
  active,
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 transition ${active
        ? "bg-white text-black"
        : "text-zinc-400"
        }`}
    >
      {icon}
    </div>
  );
}

export default function MobileBottomBar() {
  const pathname = usePathname();

  const { user } = useAuthStore();
  const { activeInterviewId, activeInterviewTime, getActiveInterview } = useInterviewFlowStore();
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
    getActiveInterview();
  }, []);

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-md md:hidden no-scrollbar">

      {activeInterviewId && pathname !== `/client/interviews/start/${activeInterviewId}` && (
        <Link
          href={`/client/interviews/start/${activeInterviewId}`}
          className="block border-b border-zinc-800"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                <PlayCircle size={18} />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Active Interview
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-green-400">
              <Timer className="h-4 w-4 animate-pulse" />

              <span className="font-mono text-sm font-bold tracking-wider">
                {formatTime(displayTime)}
              </span>
            </div>
          </div>
        </Link>
      )}

      <div className="flex items-center justify-around py-3">

        {!isAdminRoute ? (
          <>
            <Link href="/client">
              <BottomItem
                icon={<Home size={20} />}
                active={pathname === "/client"}
              />
            </Link>

            <Link href="/client/interviews">
              <BottomItem
                icon={<Logs size={20} />}
                active={pathname.startsWith("/client/interviews")}
              />
            </Link>

            {/* <Link href="/client/questions">
              <BottomItem
                icon={<FileQuestion size={20} />}
                active={pathname.startsWith("/client/questions")}
              />
            </Link> */}

            <Link href="/client/profile">
              <BottomItem
                icon={<User size={20} />}
                active={pathname.startsWith("/client/profile")}
              />
            </Link>

            {user?.isOwner && (
              <Link href="/admin">
                <BottomItem
                  icon={<Crown size={20} />}
                  active={false}
                />
              </Link>
            )}
          </>
        ) : (
          <>
            <Link href="/admin">
              <BottomItem
                icon={<Home size={20} />}
                active={pathname === "/admin"}
              />
            </Link>

            <Link href="/admin/questions">
              <BottomItem
                icon={<FileQuestion size={20} />}
                active={pathname.startsWith("/admin/questions")}
              />
            </Link>

            <Link href="/admin/plans">
              <BottomItem
                icon={<CreditCard size={20} />}
                active={pathname.startsWith("/admin/plans")}
              />
            </Link>

            <Link href="/client">
              <BottomItem
                icon={<Users size={20} />}
                active={false}
              />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}