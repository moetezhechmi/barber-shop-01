"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/toast";
import {
  Scissors, Search, Calendar, User, LogOut, Menu, X, Home, MapPin, Bell
} from "lucide-react";

const navLinks = [
  { href: "/client/search", label: "Nos Salons", icon: MapPin },
  { href: "/client/appointments", label: "Mes rendez-vous", icon: Calendar },
];

const bottomNav = [
  { href: "/client/search", label: "Salons", icon: MapPin },
  { href: "/client/appointments", label: "Rendez-vous", icon: Calendar },
  { href: "/client/profile", label: "Profil", icon: User },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string } | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setDrawerOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pb-24 sm:pb-0 font-sans text-neutral-900 dark:text-neutral-50 selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-100">
        
        {/* Decorative ambient background elements */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/10 dark:bg-violet-600/5 rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-neutral-200/50 dark:border-white/10 bg-white/70 dark:bg-black/50 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: hamburger only (logo removed) */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center justify-center rounded-xl p-2.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10 sm:hidden transition-colors"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 relative ${
                      active
                        ? "text-violet-700 dark:text-violet-300"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-white/5"
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-violet-100 dark:bg-violet-900/30 rounded-xl -z-10" />
                    )}
                    <Icon className={`h-4 w-4 ${active ? "scale-110" : ""}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-white/50 text-neutral-600 shadow-sm hover:bg-neutral-50 dark:border-white/10 dark:bg-black/50 dark:text-neutral-300 dark:hover:bg-white/5 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-neutral-950 bg-red-500"></span>
              </button>

              {/* Desktop user */}
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-3 rounded-full border border-neutral-200/80 bg-white/50 px-2 py-1.5 text-sm font-medium shadow-sm hover:bg-neutral-50 dark:border-white/10 dark:bg-black/50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-inner">
                    {user ? user.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <span className="hidden sm:inline pr-2 text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{user?.name || "Invité"}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 sm:w-64 origin-top-right animate-scale-in rounded-2xl border border-neutral-200/50 bg-white/90 backdrop-blur-xl py-2 shadow-2xl dark:border-white/10 dark:bg-neutral-900/90 overflow-hidden">
                    {user && (
                      <>
                        <div className="px-4 py-3 bg-neutral-50/50 dark:bg-white/5 mb-1">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/client/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-violet-50 hover:text-violet-700 dark:text-neutral-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-300 transition-colors mx-2 rounded-xl"
                        >
                          <div className="bg-neutral-100 dark:bg-white/10 p-1.5 rounded-lg">
                            <User className="h-4 w-4" />
                          </div>
                          Mon profil
                        </Link>
                      </>
                    )}
                    {!user && (
                      <Link
                        href="/auth/login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-violet-50 hover:text-violet-700 dark:text-neutral-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-300 transition-colors mx-2 rounded-xl"
                      >
                        <div className="bg-neutral-100 dark:bg-white/10 p-1.5 rounded-lg">
                          <User className="h-4 w-4" />
                        </div>
                        Connexion
                      </Link>
                    )}
                    <div className="h-px bg-neutral-200/50 dark:bg-white/10 my-1 mx-4" />
                    <button
                      onClick={handleLogout}
                      className="flex w-[calc(100%-16px)] items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300 transition-colors mx-2 rounded-xl"
                    >
                      <div className="bg-red-100/50 dark:bg-red-500/20 p-1.5 rounded-lg">
                        <LogOut className="h-4 w-4" />
                      </div>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDrawerOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[280px] animate-slide-in bg-white dark:bg-neutral-900 shadow-2xl flex flex-col border-r border-neutral-200/50 dark:border-white/10">
              
              {/* Drawer Header */}
              <div className="relative p-6 bg-gradient-to-br from-violet-600 to-indigo-600 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="flex items-center justify-between relative z-10 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 font-bold text-lg shadow-lg">
                    {user ? user.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full p-2 bg-black/20 text-white hover:bg-black/40 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative z-10">
                  <p className="text-lg font-bold text-white">
                    {user?.name || "Bienvenue !"}
                  </p>
                  {user && (
                    <p className="text-sm text-white/80 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Drawer Nav */}
              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                          : "text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
                      {link.label}
                    </Link>
                  );
                })}
                {user && (
                  <Link
                    href="/client/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-white/5 transition-all"
                  >
                    <User className="h-5 w-5" />
                    Mon profil
                  </Link>
                )}
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-neutral-100 dark:border-white/10 shrink-0">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-violet-700 shadow-lg shadow-violet-500/30 transition-all"
                  >
                    <User className="h-5 w-5" />
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="relative">{children}</main>

        {/* Mobile bottom nav (Floating) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md sm:hidden">
          <nav className="flex items-center justify-between px-8 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-2">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all duration-300 ${
                    active
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-violet-100/50 dark:bg-violet-500/20 rounded-2xl -z-10 animate-scale-in" />
                  )}
                  <Icon className={`h-5 w-5 mb-0.5 transition-transform duration-300 ${active ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-semibold transition-all duration-300 ${active ? "opacity-100" : "opacity-70"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </ToastProvider>
  );
}
