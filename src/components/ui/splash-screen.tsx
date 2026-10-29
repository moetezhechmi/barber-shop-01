"use client";

import * as React from "react";
import { Scissors } from "lucide-react";

export function SplashScreen() {
  const [visible, setVisible] = React.useState(true);
  const [fading, setFading] = React.useState(false);

  React.useEffect(() => {
    // Start fade-out after 1.8s
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    // Remove from DOM after fade completes (400ms)
    const removeTimer = setTimeout(() => setVisible(false), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-400 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Soft ambient blobs */}
      <div className="absolute top-0 left-0 h-[50vh] w-[50vw] rounded-full bg-violet-100 opacity-50 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[50vh] w-[50vw] rounded-full bg-indigo-100 opacity-50 blur-[120px]" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5 animate-splash-in">
        {/* Logo icon */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-300">
          {/* Subtle glare */}
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/20 to-transparent" />
          <Scissors className="h-9 w-9 text-white" strokeWidth={1.75} />
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tracking-tight text-neutral-900">
            BarberPro
          </span>
          <span className="text-sm text-neutral-400 font-medium tracking-wide">
            Réservation en ligne
          </span>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>

      {/* Bottom tag */}
      <p className="absolute bottom-8 text-xs text-neutral-300 tracking-widest uppercase font-medium">
        Andalous Barber
      </p>
    </div>
  );
}
