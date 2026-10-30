"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/components/ui/app-logo";
import {
  LayoutDashboard,
  Store,
  Users,
  Scissors,
  Calendar,
  Clock,
  Search,
  Image,
  Tag,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navMap: Record<string, NavItem[]> = {
  owner: [
    { label: "Dashboard",    href: "/owner/dashboard",    icon: LayoutDashboard },
    { label: "Mon Salon",    href: "/owner/shop",          icon: Store },
    { label: "Offres",       href: "/owner/promotions",    icon: Tag },
    { label: "Barbiers",     href: "/owner/barbers",       icon: Users },
    { label: "Boutique",     href: "/owner/products",      icon: ShoppingBag },
    { label: "Services",     href: "/owner/services",      icon: Scissors },
    { label: "Rendez-vous",  href: "/owner/appointments",  icon: Calendar },
  ],
  barber: [
    { label: "Dashboard",   href: "/barber/dashboard",    icon: LayoutDashboard },
    { label: "Planning",    href: "/barber/schedule",      icon: Clock },
    { label: "Rendez-vous", href: "/barber/appointments",  icon: Calendar },
    { label: "Galerie",     href: "/barber/gallery",       icon: Image },
  ],
  client: [
    { label: "Rechercher",      href: "/client/search",       icon: Search },
    { label: "Boutique",        href: "/client/products",     icon: ShoppingBag },
    { label: "Offres",          href: "/client/promotions",   icon: Tag },
    { label: "Mes Rendez-vous", href: "/client/appointments", icon: Calendar },
  ],
};

interface SidebarProps {
  userRole?: "owner" | "barber" | "client";
}

export function Sidebar({ userRole = "client" }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navMap[userRole] || navMap.client;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-neutral-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center px-5 border-b border-neutral-100">
        <AppLogo size="sm" showName={true} />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-violet-50 text-violet-700 font-semibold"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-violet-600" : "text-neutral-400"
                )}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
