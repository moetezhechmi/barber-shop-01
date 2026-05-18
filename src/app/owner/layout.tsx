"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, navMap } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ToastProvider } from "@/components/ui/toast";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const ownerNav = navMap.owner;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-neutral-50/50 dark:bg-[#0a0a0a] pb-24 lg:pb-0 font-sans text-neutral-900 dark:text-neutral-50 selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-violet-100">
        
        {/* Decorative ambient background elements */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/10 dark:bg-violet-600/5 rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full mix-blend-multiply blur-3xl opacity-50 pointer-events-none" />

        <Navbar />
        <Sidebar userRole="owner" />
        
        <main className="relative lg:pl-64 pt-4 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav (Floating) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-md lg:hidden">
          <nav className="flex items-center justify-between px-6 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] py-2">
            {ownerNav.map((item) => {
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
