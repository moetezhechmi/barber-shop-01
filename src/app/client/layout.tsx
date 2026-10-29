"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { MapPin, Calendar, User, LogOut, Bell, Scissors, Tag, ShoppingBag, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { SSEProvider } from "@/components/ui/sse-provider";
import { useNotifStore } from "@/store/notif.store";

const bottomNav = [
  { href: "/client/search",       label: "Accueil",     icon: MapPin },
  { href: "/client/products",     label: "Boutique",    icon: ShoppingBag },
  { href: "/client/promotions",   label: "Offres",      icon: Tag, isPromo: true },
  { href: "/client/appointments", label: "Rendez-vous", icon: Calendar },
  { href: "/client/profile",      label: "Profil",      icon: User },
];

function chime() {
  try {
    const A = window.AudioContext || (window as any).webkitAudioContext;
    if (!A) return;
    const ctx = new A(), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

/* ── Notification Bell using store ── */
function NotifBell() {
  const router = useRouter();
  const { toast } = useToast();
  const { notifications, unreadCount, markRead, startPolling } = useNotifStore();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const seen = React.useRef(new Set<string>());
  const first = React.useRef(true);

  // Start polling + toast new notifications with chime
  React.useEffect(() => {
    const stop = startPolling(10000);
    return stop;
  }, [startPolling]);

  // Detect new notifications and chime
  React.useEffect(() => {
    if (first.current) {
      notifications.forEach((n) => seen.current.add(n.id));
      first.current = false;
      return;
    }
    let hasNew = false;
    notifications.forEach((n) => {
      if (!seen.current.has(n.id)) {
        seen.current.add(n.id);
        hasNew = true;
        toast(n.message, n.type === "PROMOTION" ? "success" : "info");
      }
    });
    if (hasNew) chime();
  }, [notifications, toast]);

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative h-9 w-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 active:scale-95 transition-transform">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-violet-600 text-[9px] font-bold text-white flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 origin-top-right bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <p className="font-semibold text-neutral-900 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                {unreadCount} non lu{unreadCount > 1 ? "es" : "e"}
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-neutral-200 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    setOpen(false);
                    router.push(
                      n.type === "PROMOTION" || n.message?.toLowerCase().includes("offre")
                        ? "/client/promotions"
                        : "/client/appointments"
                    );
                  }}
                  className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-neutral-50 ${n.isRead ? "bg-white" : "bg-violet-50/40"}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === "PROMOTION" ? "bg-red-100 text-red-500" : "bg-violet-100 text-violet-600"}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.isRead ? "text-neutral-500" : "font-semibold text-neutral-900"}`}>{n.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  {!n.isRead && <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0 mt-1" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Push Prompt ── */
function PushPrompt() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-neutral-200">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 text-sm">Activez les notifications</p>
            <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">Recevez vos offres et rappels de RDV.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setShow(false)} className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition-colors">
            Plus tard
          </button>
          <button
            onClick={async () => {
              const p = await Notification.requestPermission();
              setShow(false);
              if (p === "granted") new Notification("BarberPro", { body: "Notifications activees !" });
            }}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-all"
          >
            Activer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Client Layout ── */
function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Auth from store
  const { user, fetchUser, logout } = useAuthStore();
  const [showLogout, setShowLogout] = React.useState(false);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/client/search") return pathname === href || pathname.startsWith("/client/shops/");
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-dvh bg-slate-50 font-sans" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* TOP APP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
              <Scissors className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-neutral-900 text-base tracking-tight">BarberPro</span>
          </div>

          <div className="flex items-center gap-2">
            <NotifBell />
            <button onClick={() => setShowLogout(o => !o)} className="relative h-9 w-9 rounded-full overflow-hidden active:scale-95 transition-transform">
              {user?.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                : <div className="h-full w-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                  </div>
              }
            </button>

            {showLogout && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />
                <div className="absolute right-4 top-14 z-50 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
                  {user && (
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="font-semibold text-neutral-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                    </div>
                  )}
                  <div className="p-1">
                    <Link href="/client/profile" onClick={() => setShowLogout(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                      <User className="h-4 w-4 text-neutral-400" />Mon profil
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="h-4 w-4" />Deconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <PushPrompt />

      {/* Float button - hidden on shop page */}
      {!pathname.startsWith("/client/shops/") && (
        <Link
          href="/client/search"
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300 transition-all hover:shadow-xl active:scale-95"
          aria-label="Prendre un rendez-vous"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Link>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-stretch max-w-lg mx-auto">
          {bottomNav.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative active:scale-95 transition-transform">
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-violet-600 rounded-full" />}
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${active ? "bg-violet-50" : ""}`}>
                  <Icon className={`h-5 w-5 transition-colors ${active ? "text-violet-600" : "text-neutral-400"}`} strokeWidth={active ? 2.2 : 1.8} />
                  {item.isPromo && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${active ? "text-violet-600" : "text-neutral-400"}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SSEProvider>
        <ClientLayoutInner>{children}</ClientLayoutInner>
      </SSEProvider>
    </ToastProvider>
  );
}