"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, User, Scissors, Bell, CheckCheck, BellOff } from "lucide-react";
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
    return `Il y a ${Math.floor(diffHours / 24)} j`;
  } catch {
    return "";
  }
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = React.useState<{ id: string; name: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<DbNotification[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const bellRef = React.useRef<HTMLButtonElement>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { setUser(null); return; }
      const meData = await meRes.json();
      setUser(meData?.user ?? null);
      if (meData?.user) {
        const notifRes = await fetch("/api/notifications");
        if (notifRes.ok) {
          const nd = await notifRes.json();
          setNotifications(nd.notifications || []);
        }
      }
    } catch {
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
    const interval = setInterval(async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) return;
        const meData = await meRes.json();
        if (meData?.user) {
          const notifRes = await fetch("/api/notifications");
          if (notifRes.ok) {
            const nd = await notifRes.json();
            setNotifications(nd.notifications || []);
          }
        }
      } catch { /* silent */ }
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationsOpen &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) setNotificationsOpen(false);
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

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" }).catch(() => {});
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications", { method: "PUT" }).catch(() => {});
  }

  const roleKey = user?.role?.toLowerCase() as keyof typeof navMap;
  const navItems: NavItem[] = roleKey && navMap[roleKey] ? navMap[roleKey] : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
            <Scissors className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-base font-bold text-neutral-900 tracking-tight">BarberPro</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {user && navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <button
                  ref={bellRef}
                  onClick={() => { setNotificationsOpen(!notificationsOpen); setMenuOpen(false); }}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    notificationsOpen
                      ? "bg-violet-50 text-violet-600"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">Notifications</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {unreadCount === 0 ? "Toutes lues" : `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Tout lire
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 mb-2.5">
                            <BellOff className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium text-neutral-700">Aucune notification</p>
                          <p className="text-xs text-neutral-400 mt-0.5">Les alertes apparaîtront ici</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              setNotificationsOpen(false);
                              router.push(user.role === "BARBER" ? "/barber/appointments" : "/client/appointments");
                            }}
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-neutral-50",
                              !n.isRead && "bg-violet-50/40"
                            )}
                          >
                            {!n.isRead && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                            )}
                            <div className={cn("flex-1 min-w-0", n.isRead && "pl-5")}>
                              <p className={cn(
                                "text-xs leading-relaxed text-neutral-600 break-words",
                                !n.isRead && "font-semibold text-neutral-900"
                              )}>
                                {n.message}
                              </p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
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

              {/* Profile menu */}
              <div className="relative">
                <button
                  onClick={() => { setMenuOpen(!menuOpen); setNotificationsOpen(false); }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                  aria-label="Profil"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{user.name}</p>
                        <p className="text-xs text-neutral-400 capitalize">{user.role.toLowerCase()}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href={`/${user.role.toLowerCase()}/profile`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          <User className="h-4 w-4 text-neutral-400" />
                          Mon profil
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500 transition-all"
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
