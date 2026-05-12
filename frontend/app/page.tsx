"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/useAuth";

export default function HomePage() {
  const router = useRouter();

  const {
    user,
    checkAuth,
    isCheckingAuth,
  } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
    }
  }, [user, isCheckingAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-400">
        Loading...
      </p>
    </div>
  );
}