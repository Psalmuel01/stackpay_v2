"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getConnectedWalletAddress } from "@/lib/stacks";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  level: "info" | "success" | "warning" | "error";
  read_at?: string | null;
  created_at: string;
};

export default function NotificationsButton() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setWalletAddress(getConnectedWalletAddress());
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    const resolvedWalletAddress = walletAddress;

    async function loadNotifications() {
      const response = await fetch(`/api/notifications?walletAddress=${encodeURIComponent(resolvedWalletAddress)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        return;
      }

      if (!cancelled) {
        setNotifications((payload.data ?? []) as NotificationItem[]);
      }
    }

    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [walletAddress]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !walletAddress) {
      return;
    }

    const resolvedWalletAddress = walletAddress;

    void fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletAddress: resolvedWalletAddress }),
    }).then(() => {
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at ?? new Date().toISOString(),
        }))
      );
    });
  }, [open, walletAddress]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 transition hover:border-white/20 hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-300 px-1 text-[10px] font-semibold text-black">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+12px)] w-96 rounded-3xl border border-white/10 bg-[#0a0a0a]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mb-2 flex items-center justify-between px-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/35">Notifications</div>
            <span className="text-xs text-white/40">{notifications.length} recent</span>
          </div>
          <div className="space-y-2">
            {notifications.length ? (
              notifications.map((item) => {
                const content = (
                  <div
                    className={`rounded-2xl px-3 py-3 text-sm transition ${
                      item.read_at
                        ? "bg-white/5 text-white/70"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-1 text-sm text-white/55">{item.body}</div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/30">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(item.created_at))}
                    </div>
                  </div>
                );

                return item.href ? (
                  <Link key={item.id} href={item.href} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-white/5 px-3 py-4 text-sm text-white/55">
                No notifications yet. Invoice-paid events will show up here once the Chainhook webhook starts posting.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
