import React, { useState } from "react";
import {
  Bell,
  Calendar,
  FlaskConical,
  Pill,
  X,
  CheckCircle2,
  MessageCircle,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useNotifications, type PushNotification } from "@/lib/notifications";

function getIconForType(type: string, severity: string) {
  if (type === "queue") return Users;
  if (type === "lab_order") return FlaskConical;
  if (type === "pharmacy_stock") return Pill;
  if (type === "appointment") return Calendar;
  return Bell;
}

function getColorsForSeverity(severity: string): { color: string; bgColor: string } {
  switch (severity) {
    case "urgent":
      return { color: "text-red-600", bgColor: "bg-red-50" };
    case "warning":
      return { color: "text-yellow-600", bgColor: "bg-yellow-50" };
    default:
      return { color: "text-blue-600", bgColor: "bg-blue-50" };
  }
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, dismiss, dismissAll, undismissedCount } = useNotifications();

  const count = undismissedCount;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className={`h-5 w-5 ${count > 0 ? "text-gray-700" : ""}`} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-1">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            style={{ width: 340 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                {count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {count}
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  onClick={dismissAll}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <CheckCircle2 className="h-8 w-8 opacity-40" />
                <p className="text-sm">All clear — no new alerts.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = getIconForType(n.type, n.severity);
                  const { color, bgColor } = getColorsForSeverity(n.severity);
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${bgColor}`}>
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatAge(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center">
                Live updates via WebSocket • Dismissals saved per session
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
