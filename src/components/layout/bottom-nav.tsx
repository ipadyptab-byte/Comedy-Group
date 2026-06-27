"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calendar, 
  ClipboardList, 
  User,
  Settings,
  Users,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Settings },
  { href: "/admin/families", label: "Families", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "captain";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {isAdmin && adminItems.slice(0, 1).map((item) => {
          const isActive = pathname.startsWith("/admin");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive && "bg-secondary/10 text-secondary"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-secondary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
