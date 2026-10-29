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
      <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0 font-sans text-neutral-900 selection:bg-violet-100 selection:text-violet-900">
        
        {/* Subtle ambient background */}
        <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <Navbar />
        <Sidebar userRole="owner" />
        
        <main className="relative lg:pl-64 pt-4 lg:pt-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-10">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg lg:hidden">
          <nav className="flex items-center justify-between px-2 sm:px-3 rounded-2xl bg-white border border-neutral-200 shadow-lg shadow-neutral-200/60 py-2">
            {ownerNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center flex-1 min-w-0 h-12 rounded-xl transition-all duration-200 ${
                    active
                      ? "text-violet-600"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-violet-50 rounded-xl -z-10" />
                  )}
                  <Icon className={`h-5 w-5 mb-0.5 ${active ? "text-violet-600" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
                  <span className={`text-[9px] font-semibold truncate px-0.5 leading-tight ${active ? "text-violet-600" : "text-neutral-400"}`}>
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
