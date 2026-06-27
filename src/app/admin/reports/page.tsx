"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Users, Utensils, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#7C3AED', '#F97316', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export default function AdminReportsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [familyAttendance, setFamilyAttendance] = useState<{ name: string; count: number }[]>([]);
  const [eventAttendance, setEventAttendance] = useState<{ name: string; attendance: number; total: number }[]>([]);
  const [popularItems, setPopularItems] = useState<{ name: string; count: number }[]>([]);
  const [orderStats, setOrderStats] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Family attendance stats
      const { data: families } = await supabase.from("families").select("*").order("name");
      
      if (families) {
        const familyIds = families.map(f => f.id);
        const { data: attendances } = await supabase
          .from("attendance")
          .select("*")
          .in("family_id", familyIds)
          .eq("status", "yes");

        const attendanceCount: Record<string, number> = {};
        attendances?.forEach(a => {
          attendanceCount[a.family_id] = (attendanceCount[a.family_id] || 0) + 1;
        });

        setFamilyAttendance(
          families.map(f => ({
            name: f.name.split(" ")[0],
            count: attendanceCount[f.id] || 0,
          }))
        );
      }

      // Event attendance rates
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false })
        .limit(10);

      if (events) {
        const eventStats = await Promise.all(
          events.map(async (event) => {
            const { data: attendances } = await supabase
              .from("attendance")
              .select("*")
              .eq("event_id", event.id);

            const yesCount = attendances?.filter(a => a.status === "yes").length || 0;
            return {
              name: event.name.substring(0, 15) + (event.name.length > 15 ? "..." : ""),
              attendance: yesCount,
              total: 7,
            };
          })
        );
        setEventAttendance(eventStats);
      }

      // Popular food items
      const { data: orders } = await supabase
        .from("food_orders")
        .select(`
          *,
          menu_item:menu_items(*)
        `);

      if (orders) {
        const itemCount: Record<string, { name: string; count: number }> = {};
        orders.forEach(order => {
          if (order.menu_item) {
            if (!itemCount[order.menu_item_id]) {
              itemCount[order.menu_item_id] = { name: order.menu_item.name, count: 0 };
            }
            itemCount[order.menu_item_id].count += order.quantity;
          }
        });

        setPopularItems(
          Object.values(itemCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
        );
      }

      // Order by category
      const { data: categories } = await supabase.from("menu_categories").select("*").order("display_order");
      
      if (categories && orders) {
        const categoryCount: Record<string, number> = {};
        categories.forEach(cat => {
          const catOrders = orders.filter(o => o.menu_item?.category_id === cat.id);
          categoryCount[cat.name] = catOrders.reduce((sum, o) => sum + o.quantity, 0);
        });

        setOrderStats(
          Object.entries(categoryCount)
            .filter(([_, count]) => count > 0)
            .map(([category, count]) => ({ category, count }))
        );
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Analytics and insights</p>
        </div>
      </div>

      {/* Most Active Families */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Most Active Families
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={familyAttendance} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#7C3AED" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Popular Food Items */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            Popular Food Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularItems}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders by Category */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Orders by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStats}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {orderStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Event Attendance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Event Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventAttendance}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis domain={[0, 7]} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#10B981" name="Attendance" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
