"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  ArrowRight,
  Search
} from "lucide-react";
import { formatDate, formatTime, getEventTypeLabel, getEventTypeColor } from "@/lib/utils";
import type { Event, Attendance } from "@/types/database";

export default function EventsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [attendances, setAttendances] = useState<Record<string, Attendance>>({});
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      let query = supabase
        .from("events")
        .select(`
          *,
          host_family:families(*)
        `)
        .order("date", { ascending: activeTab === "upcoming" });

      if (activeTab === "upcoming") {
        query = query.gte("date", today);
      } else {
        query = query.lt("date", today);
      }

      const { data: eventsData } = await query;

      if (eventsData && user?.family?.id) {
        const eventIds = eventsData.map(e => e.id);
        
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("family_id", user.family.id)
          .in("event_id", eventIds);

        const attendanceMap: Record<string, Attendance> = {};
        attendanceData?.forEach(a => {
          attendanceMap[a.event_id] = a;
        });
        setAttendances(attendanceMap);
      }

      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.restaurant?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        {(user?.role === "admin" || user?.role === "captain") && (
          <Link href="/events/create">
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "upcoming" ? "default" : "outline"}
          onClick={() => setActiveTab("upcoming")}
          className={activeTab === "upcoming" ? "btn-primary" : ""}
        >
          Upcoming
        </Button>
        <Button
          variant={activeTab === "past" ? "default" : "outline"}
          onClick={() => setActiveTab("past")}
          className={activeTab === "past" ? "btn-primary" : ""}
        >
          Past Events
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "upcoming"
                ? "There are no upcoming events. Create one to get started!"
                : "No past events to display."}
            </p>
            {(user?.role === "admin" || user?.role === "captain") && activeTab === "upcoming" && (
              <Link href="/events/create">
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const attendance = attendances[event.id];
            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="glass-card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl gradient-primary flex flex-col items-center justify-center text-white flex-shrink-0">
                        <span className="text-xs font-medium">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">
                            {event.name}
                          </h3>
                          {attendance && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              attendance.status === 'yes' 
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : attendance.status === 'no'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-amber-500/20 text-amber-500'
                            }`}>
                              {attendance.status === 'yes' ? 'Going' : attendance.status === 'no' ? 'Not Going' : 'Maybe'}
                            </span>
                          )}
                        </div>
                        
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)} mb-2`}>
                          {getEventTypeLabel(event.type)}
                        </span>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(event.time)}</span>
                          </div>
                          {event.restaurant && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{event.restaurant}</span>
                            </div>
                          )}
                          {event.host_family && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>Hosted by {event.host_family.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
