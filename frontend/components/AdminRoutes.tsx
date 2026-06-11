"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/useAuth";

export default function AdminRoute({
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

    // not logged in
    if (!isCheckingAuth && !user) {
      router.replace("/auth/login");
      return;
    }

    // logged in but not admin
    if (
      !isCheckingAuth &&
      user &&
      !user.isOwner
    ) {
      router.replace("/client");
    }

  }, [user, isCheckingAuth]);
  // console.log("auth",isCheckingAuth)
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading... (if it takes too long please hit refresh)
      </div>
    );
  }

  if (!user || !user.isOwner) {
    return null;
  }

  return children;
}