import * as React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  className?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 rounded-xl border-[3px]",
  md: "h-12 w-12 rounded-2xl border-4",
  lg: "h-16 w-16 rounded-2xl border-4",
  xl: "h-20 w-20 rounded-3xl border-[5px]",
};

export function Spinner({
  size = "lg",
  label,
  className = "",
  fullPage = false,
}: SpinnerProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${fullPage ? "min-h-[60vh] py-16" : "py-12"} ${className}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-400 animate-spin`}
        />
      </div>
      {label && (
        <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-wide text-sm animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-dvh flex items-center justify-center w-full">
        {content}
      </div>
    );
  }

  return content;
}
