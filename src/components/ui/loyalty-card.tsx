"use client";

import * as React from "react";
import { Scissors, Gift, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoyaltyCardProps {
  stamps: number;
  goal: number;
  totalEarned: number;
  cardsCompleted: number;
  className?: string;
}

export function LoyaltyCard({
  stamps,
  goal,
  totalEarned,
  cardsCompleted,
  className,
}: LoyaltyCardProps) {
  const slots = goal + 1;
  const allDone = stamps >= goal;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-5 text-white shadow-lg",
      allDone
        ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-amber-300"
        : "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-200",
      className
    )}>
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-widest", allDone ? "text-amber-100" : "text-violet-200")}>
            Carte de fidelite
          </p>
          <h3 className="mt-0.5 text-lg font-bold text-white">
            {allDone ? "10e RDV GRATUIT !" : `${stamps} / ${goal} tampons`}
          </h3>
          <p className={cn("mt-0.5 text-xs", allDone ? "text-amber-100 font-semibold" : "text-violet-200")}>
            {allDone
              ? "Votre prochain rendez-vous est offert"
              : `Encore ${goal - stamps} rendez-vous pour votre coupe gratuite`}
          </p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", allDone ? "bg-white/30 animate-pulse" : "bg-white/20")}>
          {allDone ? <Gift className="h-5 w-5 text-white" /> : <Scissors className="h-5 w-5 text-white" strokeWidth={1.75} />}
        </div>
      </div>

      <div className="relative grid grid-cols-5 gap-2">
        {Array.from({ length: slots }).map((_, i) => {
          const isEarned = i < stamps;
          const isFree = i === goal;
          const isNext = i === stamps && !allDone;
          return (
            <div
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border-2 transition-all",
                isFree
                  ? allDone ? "border-white bg-white/30 shadow-lg scale-110" : "border-white/30 bg-white/10"
                  : isEarned
                    ? "border-white/60 bg-white/20"
                    : isNext
                      ? "border-white/50 bg-white/10 animate-pulse"
                      : "border-white/20 bg-white/5"
              )}
            >
              {isFree ? (
                <Gift className={cn("h-4 w-4", allDone ? "text-white" : "text-white/30")} />
              ) : isEarned ? (
                <Scissors className="h-4 w-4 text-white" strokeWidth={2} />
              ) : (
                <span className="text-[10px] font-bold text-white/30">{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 flex items-center gap-4 border-t border-white/20 pt-3">
        <div className="flex items-center gap-1.5">
          <Scissors className={cn("h-3.5 w-3.5", allDone ? "text-amber-100" : "text-violet-300")} />
          <span className={cn("text-xs", allDone ? "text-amber-100" : "text-violet-200")}>
            <span className="font-bold text-white">{totalEarned}</span> RDV au total
          </span>
        </div>
        {cardsCompleted > 0 && (
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-300" />
            <span className={cn("text-xs", allDone ? "text-amber-100" : "text-violet-200")}>
              <span className="font-bold text-white">{cardsCompleted}</span> carte{cardsCompleted > 1 ? "s" : ""} complete{cardsCompleted > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoyaltyCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-violet-100 p-5 animate-pulse", className)}>
      <div className="h-4 w-32 rounded bg-violet-200 mb-2" />
      <div className="h-6 w-48 rounded bg-violet-200 mb-4" />
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-violet-200" />
        ))}
      </div>
    </div>
  );
}
