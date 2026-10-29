"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, navMap } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { SSEProvider } from "@/components/ui/sse-provider";
import { useNotifStore } from "@/store/notif.store";

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

// Notification handler using the global notif store
function NotificationHandler() {
  const { toast } = useToast();
  const { notifications, startPolling } = useNotifStore();
  const seenIds = React.useRef<Set<string>>(new Set());
  const isFirstLoad = React.useRef(true);

  React.useEffect(() => {
    const stop = startPolling(10000);
    return stop;
  }, [startPolling]);

  React.useEffect(() => {
    if (isFirstLoad.current) {
      notifications.forEach((n) => seenIds.current.add(n.id));
      isFirstLoad.current = false;
      return;
    }
    let hasNew = false;
    notifications.forEach((n) => {
      if (!seenIds.current.has(n.id)) {
        seenIds.current.add(n.id);
        hasNew = true;
        toast(n.message, n.type === "APPOINTMENT_REQUEST" ? "info" : "success");
      }
    });
    if (hasNew) playChimeSound();
  }, [notifications, toast]);

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
    <ToastProvider><SSEProvider>
      <NotificationHandler />
      <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0 font-sans text-neutral-900 selection:bg-violet-100 selection:text-violet-900">
        
        {/* Subtle ambient background */}
        <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <Navbar />
        <Sidebar userRole="barber" />
        
        <main className="relative lg:pl-64 pt-4 lg:pt-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-10">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-md lg:hidden">
          <nav className="flex items-center justify-around px-3 rounded-2xl bg-white border border-neutral-200 shadow-lg shadow-neutral-200/60 py-2">
            {barberNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 ${
                    active ? "text-violet-600" : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  {active && <div className="absolute inset-0 bg-violet-50 rounded-xl -z-10" />}
                  <Icon className="h-5 w-5 mb-0.5" strokeWidth={active ? 2.2 : 1.8} />
                  <span className={`text-[9px] font-semibold leading-tight ${active ? "text-violet-600" : "text-neutral-400"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </SSEProvider></ToastProvider>
  );
}
