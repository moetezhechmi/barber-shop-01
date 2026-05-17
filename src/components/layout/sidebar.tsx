"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Users,
  Scissors,
  Calendar,
  Clock,
  Search,
  Image,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navMap: Record<string, NavItem[]> = {
  owner: [
    { label: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
    { label: "Mon Salon", href: "/owner/shop", icon: Store },
    { label: "Barbiers", href: "/owner/barbers", icon: Users },
    { label: "Services", href: "/owner/services", icon: Scissors },
    { label: "Rendez-vous", href: "/owner/appointments", icon: Calendar },
  ],
  barber: [
    { label: "Dashboard", href: "/barber/dashboard", icon: LayoutDashboard },
    { label: "Planning", href: "/barber/schedule", icon: Clock },
    {
      label: "Rendez-vous",
      href: "/barber/appointments",
      icon: Calendar,
    },
    {
      label: "Galerie",
      href: "/barber/gallery",
      icon: Image,
    },
  ],
  client: [
    { label: "Rechercher", href: "/client/search", icon: Search },
    {
      label: "Mes Rendez-vous",
      href: "/client/appointments",
      icon: Calendar,
    },
  ],
};

interface SidebarProps {
  userRole?: "owner" | "barber" | "client";
}

export function Sidebar({ userRole = "client" }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navMap[userRole] || navMap.client;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6 pt-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
