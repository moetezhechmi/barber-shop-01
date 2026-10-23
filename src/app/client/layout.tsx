"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { MapPin, Calendar, User, LogOut, X, Bell, Scissors, Tag } from "lucide-react";

const bottomNav = [
  { href: "/client/search",       label: "Accueil",      icon: MapPin },
  { href: "/client/promotions",   label: "Offres",       icon: Tag, isPromo: true },
  { href: "/client/appointments", label: "Rendez-vous",  icon: Calendar },
  { href: "/client/profile",      label: "Profil",       icon: User },
];

/* ── chime ── */
function chime() {
  try {
    const A = window.AudioContext || (window as any).webkitAudioContext;
    if (!A) return;
    const ctx = new A(), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

/* ── notification bell ── */
function NotifBell() {
  const { toast } = useToast();
  const [notifs, setNotifs] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const seen = React.useRef(new Set<string>());
  const first = React.useRef(true);

  const check = React.useCallback(async () => {
    try {
      const d = await fetch("/api/notifications").then(r => r.ok ? r.json() : { notifications: [] });
      const list = d.notifications || [];
      setNotifs(list);
      if (first.current) { list.forEach((n: any) => seen.current.add(n.id)); first.current = false; return; }
      let hasNew = false;
      list.forEach((n: any) => { if (!seen.current.has(n.id)) { seen.current.add(n.id); hasNew = true; toast(n.message, n.type === "PROMOTION" ? "success" : "info"); } });
      if (hasNew) chime();
    } catch {}
  }, [toast]);

  React.useEffect(() => { check(); const i = setInterval(check, 10000); return () => clearInterval(i); }, [check]);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;
  const mark = async (id: string) => { setNotifs(p => p.map(n => n.id === id ? { ...n, isRead: true } : n)); await fetch(`/api/notifications/${id}/read`, { method: "PUT" }); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="relative h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border-2 border-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 origin-top-right bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="font-black text-gray-900">Notifications</p>
            {unread > 0 && <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{unread} non lu{unread > 1 ? "es" : "e"}</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0
              ? <div className="py-12 text-center"><Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">Aucune notification</p></div>
              : notifs.map(n => (
                  <div key={n.id} onClick={() => !n.isRead && mark(n.id)} className={`flex gap-3 px-5 py-3.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${n.isRead ? "bg-white" : "bg-violet-50/50"}`}>
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${n.type === "PROMOTION" ? "bg-red-100 text-red-500" : "bg-violet-100 text-violet-600"}`}><Bell className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.isRead ? "text-gray-500" : "font-semibold text-gray-900"}`}>{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                    </div>
                    {!n.isRead && <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── push prompt ── */
function PushPrompt() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      const t = setTimeout(() => setShow(true), 4000); return () => clearTimeout(t);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100">
        <div className="flex gap-3">
          <div className="h-11 w-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0"><Bell className="h-5 w-5" /></div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Activez les notifications</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Recevez vos offres et rappels de RDV.</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setShow(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500">Plus tard</button>
          <button onClick={async () => { const p = await Notification.requestPermission(); setShow(false); if (p === "granted") new Notification("BarberPro", { body: "Notifications activées ! 🎉" }); }}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white">Activer</button>
        </div>
      </div>
    </div>
  );
}

/* ── main layout ── */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string; image?: string } | null>(null);
  const [showLogout, setShowLogout] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => d.user && setUser(d.user)).catch(() => {});
  }, []);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };
  const isActive = (href: string) => {
    // For search/home: match exact or shop detail pages
    if (href === "/client/search") {
      return pathname === href || pathname.startsWith("/client/shops/");
    }
    return pathname.startsWith(href);
  };

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-gray-50 font-sans" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* ── TOP APP BAR ── */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-violet-600 flex items-center justify-center">
                  <Scissors className="h-4 w-4 text-white" />
                </div>
                <span className="font-black text-gray-900 text-base tracking-tight">BarberPro</span>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <NotifBell />

                {/* User avatar */}
                <button onClick={() => setShowLogout(o => !o)} className="relative h-10 w-10 rounded-full overflow-hidden active:scale-95 transition-transform">
                  {user?.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                    : <div className="h-full w-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white">
                        {user ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                      </div>}
                </button>

                {/* user dropdown */}
                {showLogout && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />
                    <div className="absolute right-4 top-14 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                      {user && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      )}
                      <Link href="/client/profile" onClick={() => setShowLogout(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="h-4 w-4 text-gray-400" />Mon profil
                      </Link>
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                        <LogOut className="h-4 w-4" />Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

        {/* ── PAGE CONTENT ── */}
        <main>{children}</main>

        <PushPrompt />

        {/* ── BOTTOM NAV ── */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="flex items-stretch max-w-lg mx-auto">
            {bottomNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative active:scale-95 transition-transform">
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-violet-600 rounded-full" />}
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${active ? "bg-violet-50" : ""}`}>
                    <Icon className={`h-5 w-5 transition-colors ${active ? "text-violet-600" : "text-gray-400"}`} strokeWidth={active ? 2.5 : 1.8} />
                    {item.isPromo && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${active ? "text-violet-600" : "text-gray-400"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ToastProvider>
  );
}
