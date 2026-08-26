"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getMyNotifications,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/notifications/actions";
import { cn } from "@/lib/utils/cn";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_booking_id: string | null;
  read_at: string | null;
  created_at: string;
};

/** basePath: "/mes-reservations" for customers, "/reservations" for professionals — where a related booking links to. */
export function NotificationBell({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getMyNotifications().then((data) => setNotifications(data as Notification[]));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      getMyNotifications().then((data) => setNotifications(data as Notification[]));
    }
  }

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    startTransition(() => markNotificationReadAction(id));
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    startTransition(() => markAllNotificationsReadAction());
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative rounded-full p-2 hover:bg-secondary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Aucune notification.</p>
            )}
            {notifications.map((n) => {
              const content = (
                <div
                  className={cn(
                    "border-b border-border/60 px-4 py-3 text-sm last:border-b-0",
                    !n.read_at && "bg-secondary/50"
                  )}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
                </div>
              );

              return n.related_booking_id ? (
                <Link
                  key={n.id}
                  href={`${basePath}/${n.related_booking_id}`}
                  onClick={() => !n.read_at && handleMarkRead(n.id)}
                  className="block hover:bg-secondary/30"
                >
                  {content}
                </Link>
              ) : (
                <div key={n.id} onClick={() => !n.read_at && handleMarkRead(n.id)} className="cursor-pointer">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
