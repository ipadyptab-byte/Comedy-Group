"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  Bell,
  ArrowRight,
  Clock,
  MapPin,
  PartyPopper,
  TrendingUp
} from "lucide-react";
import { formatDate, formatTime, getEventTypeLabel, getEventTypeColor } from "@/lib/utils";
import type { Event, Notification } from "@/types/database";

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch upcoming events
      const today = new Date().toISOString().split("T")[0];
      const { data: eventsData } = await supabase
        .from("events")
        .select(`
          *,
          host_family:families(*)
        `)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5);

      setEvents(eventsData || []);

      // Fetch pending responses count
      if (user?.family?.id) {
        const { count } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("family_id", user.family.id);

        setPendingCount((eventsData?.length || 0) - (count || 0));
      }

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select(`
          *,
          event:events(*)
        `)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      setNotifications(notificationsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          Hello, {user?.family?.name || "Family"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your group
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card-hover animate-fade-in stagger-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-hover animate-fade-in stagger-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(user?.role === "admin" || user?.role === "captain") && (
        <Card className="glass-card animate-fade-in stagger-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/events/create">
              <Button className="w-full btn-primary justify-start" size="lg">
                <PartyPopper className="w-5 h-5 mr-3" />
                Create New Event
              </Button>
            </Link>
            <Link href="/admin">
              <Button className="w-full btn-outline justify-start" size="lg">
                <Users className="w-5 h-5 mr-3" />
                Admin Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card className="glass-card animate-fade-in stagger-4">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Events
          </CardTitle>
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming events</p>
              {(user?.role === "admin" || user?.role === "captain") && (
                <Link href="/events/create" className="mt-3 inline-block">
                  <Button size="sm" className="btn-primary mt-2">
                    Create First Event
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent/5 transition-colors cursor-pointer">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex flex-col items-center justify-center text-white">
                      <span className="text-xs font-medium">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{event.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(event.time)}</span>
                      </div>
                      {event.restaurant && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{event.restaurant}</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-card animate-fade-in stagger-5">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            {notifications.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {notifications.length}
              </span>
            )}
          </CardTitle>
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{notification.title}</p>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
