"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  Logs,
  FileQuestion,
  User,
  Crown ,
  CreditCard,
  Users,
} from "lucide-react";

import { useAuthStore } from "@/store/useAuth";

function BottomItem({
  icon,
  active,
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 transition ${
        active
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

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-md md:hidden">

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
                  icon={<Crown  size={20} />}
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