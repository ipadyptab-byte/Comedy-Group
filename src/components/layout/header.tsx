"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border/50 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {mobileMenuOpen ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">CG</span>
            </div>
            <span className="font-bold text-lg hidden sm:block">
              Comedy Group
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          </Link>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.family?.name?.charAt(0) || "U"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium">{user?.family?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.role}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              {(user?.role === "admin" || user?.role === "captain") && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border p-4 bg-background">
          <nav className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="px-4 py-3 rounded-xl hover:bg-accent/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              className="px-4 py-3 rounded-xl hover:bg-accent/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/orders"
              className="px-4 py-3 rounded-xl hover:bg-accent/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Orders
            </Link>
            <Link
              href="/profile"
              className="px-4 py-3 rounded-xl hover:bg-accent/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            {(user?.role === "admin" || user?.role === "captain") && (
              <>
                <div className="border-t border-border my-2" />
                <Link
                  href="/admin"
                  className="px-4 py-3 rounded-xl hover:bg-accent/10 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/admin/families"
                  className="px-4 py-3 rounded-xl hover:bg-accent/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manage Families
                </Link>
                <Link
                  href="/admin/menu"
                  className="px-4 py-3 rounded-xl hover:bg-accent/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manage Menu
                </Link>
                <Link
                  href="/admin/reports"
                  className="px-4 py-3 rounded-xl hover:bg-accent/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reports
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
