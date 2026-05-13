"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  History,
  FileQuestion,
  User,
} from "lucide-react";

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900 md:hidden">
      
      <div className="flex items-center justify-around py-3">

        <Link href="/client">
          <BottomItem
            icon={<Home size={20} />}
            active={pathname === "/client"}
          />
        </Link>

        <Link href="/client/previous">
          <BottomItem
            icon={<History size={20} />}
            active={pathname.startsWith("/client/previous")}
          />
        </Link>

        <Link href="/client/questions">
          <BottomItem
            icon={<FileQuestion size={20} />}
            active={pathname.startsWith("/client/questions")}
          />
        </Link>

        <Link href="/client/profile">
          <BottomItem
            icon={<User size={20} />}
            active={pathname.startsWith("/client/profile")}
          />
        </Link>
      </div>
    </div>
  );
}