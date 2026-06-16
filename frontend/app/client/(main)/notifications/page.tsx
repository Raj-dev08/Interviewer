"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  Bell,
  Loader2,
  CheckCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/useNotification";

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    fetchNotifications,
    removeNotification,
    readNotifications,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadIds = notifications
    .filter((n) => !n.read)
    .map((n) => n._id);

  const markAllRead = async () => {
    if (unreadIds.length === 0) return;

    await readNotifications(unreadIds);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold">
              Notifications
            </h1>

            <p className="mt-2 text-zinc-400">
              Stay updated with interview activity and platform events.
            </p>
          </div>

          <Button
            onClick={markAllRead}
            disabled={unreadIds.length === 0}
            className="rounded-2xl"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : notifications.length === 0 ? (

          /* EMPTY */
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-16 text-center">
            <Bell className="mx-auto h-12 w-12 text-zinc-600" />

            <h2 className="mt-5 text-2xl font-semibold">
              No Notifications
            </h2>

            <p className="mt-3 text-zinc-400">
              You're all caught up.
            </p>
          </div>

        ) : (

          /* LIST */
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`rounded-3xl border p-6 transition ${
                  notification.read
                    ? "border-zinc-800 bg-zinc-900"
                    : "border-blue-500/40 bg-blue-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {notification.title}
                      </h2>

                      {!notification.read && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-1 text-xs text-blue-400">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-zinc-400">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-zinc-500">
                      {new Date(
                        notification.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">

                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          readNotifications([
                            notification._id,
                          ])
                        }
                      >
                        Read
                      </Button>
                    )}

                    {notification.link && (
                      <Link href={`/client/${notification.link}`}>
                        <Button size="sm">
                          View
                        </Button>
                      </Link>
                    )}

                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() =>
                        removeNotification(
                          notification._id
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </div>
                </div>
              </div>
            ))}
          </div>

        )}
      </div>
    </div>
  );
}