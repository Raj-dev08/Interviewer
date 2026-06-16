// components/providers/SocketProvider.tsx

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuth";
import { useNotificationStore } from "@/store/useNotification";
import { useInterviewStore } from "@/store/useInterview";

export default function SocketProvider() {
  const socket = useAuthStore((s) => s.socket);
  const { subscribetoNotifications } = useNotificationStore();
  const { subscribetoInterviews } = useInterviewStore();


  useEffect(() => {
    if (!socket) return;

    subscribetoNotifications();
    subscribetoInterviews();
  }, [socket]);

  return null;
}