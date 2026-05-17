"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, LogOut, User, Scissors, X, Bell, CheckCheck, BellOff } from "lucide-react";
import { navMap, type NavItem } from "@/components/layout/sidebar";

interface DbNotification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function formatRelativeTime(dateStr: string) {
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  } catch {
    return "";
  }
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = React.useState<{ id: string; name: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  // Real-time Notification Dropdown & Polling State
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<DbNotification[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const bellRef = React.useRef<HTMLButtonElement>(null);

  const fetchUserAndNotifications = React.useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData?.user ?? null);

        // Fetch notifications if user is logged in
        if (meData?.user) {
          const notifRes = await fetch("/api/notifications");
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            setNotifications(notifData.notifications || []);
          }
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    fetchUserAndNotifications();

    // Poll for real-time updates every 12 seconds
    const interval = setInterval(async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user) {
            const notifRes = await fetch("/api/notifications");
            if (notifRes.ok) {
              const notifData = await notifRes.json();
              setNotifications(notifData.notifications || []);
            }
          }
        }
      } catch (err) {
        console.error("Error polling in navbar:", err);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchUserAndNotifications]);

  // Click outside listener to automatically close dropdowns
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    setNotificationsOpen(false);
    router.push("/auth/login");
  }

  // Mark a single notification as read
  async function markAsRead(id: string) {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  // Mark all notifications as read at once
  async function markAllAsRead() {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications", { method: "PUT" });
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }

  const roleKey = user?.role?.toLowerCase() as keyof typeof navMap;
  const navItems: NavItem[] = roleKey && navMap[roleKey] ? navMap[roleKey] : [];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white/70 backdrop-blur-xl",
        "dark:border-neutral-800/60 dark:bg-neutral-950/70"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-neutral-50 font-sans tracking-tight"
        >
          <Scissors className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          BarberPro
        </Link>

        {/* Desktop & Mobile right section */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Desktop nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            {user && navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  aria-label="Profil"
                >
                  <User className="h-5 w-5" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-2xl border border-neutral-200/50 bg-white/95 backdrop-blur-xl shadow-lg dark:border-neutral-800 dark:bg-neutral-950/95 overflow-hidden z-50 animate-scale-in">
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 capitalize truncate">{user.role}</p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={`/${user.role?.toLowerCase() || 'client'}/profile`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900 rounded-xl transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Mon Profil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "relative flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300",
                    notificationsOpen
                      ? "bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-neutral-950 animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Glassmorphic Popover */}
                {notificationsOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right rounded-3xl border border-neutral-200/50 bg-white/95 backdrop-blur-xl shadow-xl dark:border-neutral-800/80 dark:bg-neutral-950/95 overflow-hidden z-50 animate-scale-in"
                  >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-neutral-200/50 dark:border-neutral-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                          Notifications
                        </h3>
                        <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                          {unreadCount === 0
                            ? "Toutes lues"
                            : `${unreadCount} non lues`}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Tout marquer lu
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-900">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 mb-3 shadow-inner">
                            <BellOff className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-250">
                            Aucune notification
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            Vous recevrez des alertes pour vos rendez-vous ici.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              // Redirect coiffeur to appointments to manage request
                              if (user.role === "BARBER") {
                                router.push("/barber/appointments");
                              } else if (user.role === "CLIENT") {
                                router.push("/client/appointments");
                              }
                              setNotificationsOpen(false);
                            }}
                            className={cn(
                              "px-5 py-4 cursor-pointer transition-colors flex items-start gap-3",
                              n.isRead
                                ? "bg-transparent hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
                                : "bg-violet-50/30 hover:bg-violet-50/50 dark:bg-violet-950/10 dark:hover:bg-violet-950/20"
                            )}
                          >
                            {/* Unread indicator */}
                            {!n.isRead && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
                            )}
                            <div className="space-y-1 flex-1 min-w-0">
                              <p className={cn(
                                "text-xs text-neutral-800 dark:text-neutral-250 leading-relaxed break-words",
                                !n.isRead && "font-bold text-neutral-900 dark:text-white"
                              )}>
                                {n.message}
                              </p>
                              <p className="text-[10px] text-neutral-400 font-semibold">
                                {formatRelativeTime(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
              >
                Inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
