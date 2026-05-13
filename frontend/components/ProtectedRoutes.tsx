"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/useAuth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const hasChecked = useRef(false);

  const {
    user,
    checkAuth,
    isCheckingAuth,
  } = useAuthStore();

  useEffect(() => {
    if (hasChecked.current || user) return;

    hasChecked.current = true;

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      router.replace("/auth/login");
    }
  }, [user, isCheckingAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return children;
}