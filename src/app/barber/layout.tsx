"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, navMap } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ToastProvider, useToast } from "@/components/ui/toast";

interface DbNotification {
  id: string;
  userId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// 100% Free Synthesizer Sound Generator using Web Audio API
// Generates a crystal-clear, premium chime/bell sound on any browser with 0 external dependencies!
function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // First bell chime (gently ringing D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.6);
    
    // Second bell chime (harmonic A5, slightly delayed)
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
      gain2.gain.setValueAtTime(0.12, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.8);
    }, 120);
  } catch (e) {
    console.warn("AudioContext not allowed or supported yet:", e);
  }
}

// Transparent Real-time Database Notification Poller & Audio Player
function NotificationHandler() {
  const { toast } = useToast();
  const router = useRouter();
  const seenIds = React.useRef<Set<string>>(new Set());
  const isFirstLoad = React.useRef(true);

  const checkNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const list: DbNotification[] = data.notifications || [];

      if (isFirstLoad.current) {
        // On first load, populate the seen list so we don't notify for historical entries
        list.forEach((n) => seenIds.current.add(n.id));
        isFirstLoad.current = false;
        return;
      }

      // Check for any new unread notifications
      let hasNewNotification = false;
      list.forEach((n) => {
        if (!seenIds.current.has(n.id)) {
          seenIds.current.add(n.id);
          hasNewNotification = true;

          // Trigger a beautiful, interactive toast notification
          toast(n.message, n.type === "APPOINTMENT_REQUEST" ? "info" : "success");
        }
      });

      if (hasNewNotification) {
        // Play the chime audio alert instantly
        playChimeSound();
      }
    } catch (err) {
      console.error("Error polling notifications:", err);
    }
  }, [toast]);

  React.useEffect(() => {
    // Check immediately on mount
    checkNotifications();

    // Poll every 10 seconds (10000ms) for high-reactivity and 100% free operation
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [checkNotifications]);

  return null;
}

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const barberNav = navMap.barber;

  return (
    <ToastProvider>
      <NotificationHandler />
      <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pb-24 lg:pb-0 font-sans text-neutral-900 dark:text-neutral-50 selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-100">
        
        {/* Decorative ambient background elements */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/10 dark:bg-violet-600/5 rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none" />

        <Navbar />
        <Sidebar userRole="barber" />
        
        <main className="relative z-10 lg:pl-64 pt-4 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav (Floating) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-md lg:hidden">
          <nav className="flex items-center justify-between px-6 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-2">
            {barberNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300 ${
                    active
                      ? "text-violet-600 dark:text-violet-400"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-violet-100/50 dark:bg-violet-500/20 rounded-2xl -z-10 animate-scale-in" />
                  )}
                  <Icon className={`h-5 w-5 mb-0.5 transition-transform duration-300 ${active ? "scale-110" : ""}`} />
                  <span className={`text-[9px] font-semibold transition-all duration-300 ${active ? "opacity-100" : "opacity-70"} text-center leading-tight`}>
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
