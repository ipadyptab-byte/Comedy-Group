"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  Utensils, 
  BarChart3,
  Settings,
  Bell,
  TrendingUp,
  PartyPopper,
  ClipboardList
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalFamilies: 0,
    upcomingEvents: 0,
    totalOrders: 0,
    pendingResponses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "captain") {
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [familiesRes, eventsRes, ordersRes, attendanceRes] = await Promise.all([
        supabase.from("families").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }).gte("date", today),
        supabase.from("food_orders").select("*", { count: "exact", head: true }),
        supabase.from("attendance").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalFamilies: familiesRes.count || 0,
        upcomingEvents: eventsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        pendingResponses: (familiesRes.count || 0) - (attendanceRes.count || 0),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "captain") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/events/create">
          <Button className="btn-primary">
            <PartyPopper className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card-hover animate-fade-in stagger-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalFamilies}</p>
                <p className="text-sm text-muted-foreground">Families</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-hover animate-fade-in stagger-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-hover animate-fade-in stagger-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-hover animate-fade-in stagger-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingResponses}</p>
                <p className="text-sm text-muted-foreground">Pending RSVPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link href="/admin/families">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Manage Families</span>
            </Button>
          </Link>
          <Link href="/admin/menu">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Utensils className="w-6 h-6" />
              <span>Manage Menu</span>
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              <span>Reports</span>
            </Button>
          </Link>
          <Link href="/admin/notifications">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Bell className="w-6 h-6" />
              <span>Notifications</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/admin/menu" className="block">
            <Button variant="ghost" className="w-full justify-start">
              <ClipboardList className="w-5 h-5 mr-3" />
              Menu Categories & Items
            </Button>
          </Link>
          <Link href="/profile" className="block">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="w-5 h-5 mr-3" />
              Account Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
