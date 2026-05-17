"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  value: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const [active, setActive] = React.useState(defaultValue || tabs[0]?.value);

  const activeTab = tabs.find((t) => t.value === active);

  return (
    <div className={className}>
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              active === tab.value
                ? "text-neutral-900 dark:text-neutral-50"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            )}
          >
            {tab.label}
            {active === tab.value && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-900 dark:bg-neutral-50" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">{activeTab?.content}</div>
    </div>
  );
}
