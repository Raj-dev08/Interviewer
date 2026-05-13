"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  User,
  CreditCard,
  FileQuestion,
  History,
  LayoutDashboard,
} from "lucide-react";

import { useAuthStore } from "@/store/useAuth";

import SidebarItem from "./SideBarItem";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const { user } = useAuthStore();

  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-zinc-800 bg-zinc-900/50">

      <div className="border-b border-zinc-800 p-6">

        <h1 className="text-2xl font-bold">
          MockIT
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          AI Interview Platform
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">

        <Link href="/client">
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={pathname === "/client"}
          />
        </Link>

        <Link href="/client/previous">
          <SidebarItem
            icon={<History size={18} />}
            label="Previous Interviews"
            active={pathname.startsWith("/client/previous")}
          />
        </Link>

        <Link href="/client/questions">
          <SidebarItem
            icon={<FileQuestion size={18} />}
            label="Questions"
            active={pathname.startsWith("/client/questions")}
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
          <Link href="/admin/questions">
            <SidebarItem
              icon={<FileQuestion size={18} />}
              label="Admin Questions"
              active={pathname.startsWith("/admin")}
            />
          </Link>
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
    </aside>
  );
}