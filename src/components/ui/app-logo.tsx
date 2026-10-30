import Image from "next/image";
import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "h-8 w-8",   text: "text-base font-bold", img: 32 },
  md: { box: "h-10 w-10", text: "text-lg font-bold",   img: 40 },
  lg: { box: "h-16 w-16", text: "text-2xl font-bold",  img: 64 },
};

export function AppLogo({ size = "sm", showName = true, className }: AppLogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm", s.box)}>
        <Image
          src="/logo.jpg"
          alt="GUI COIF"
          fill
          sizes={`${s.img}px`}
          className="object-cover"
          priority
        />
        {/* Fallback icon if image fails to load */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0">
          <Scissors className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
      </div>
      {showName && (
        <span className={cn("text-neutral-900 tracking-tight", s.text)}>
          GUI COIF
        </span>
      )}
    </div>
  );
}