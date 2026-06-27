"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Utensils,
  Share2,
  QrCode,
  ExternalLink,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  Edit
} from "lucide-react";
import { formatDate, formatTime, getEventTypeLabel, getEventTypeColor, getStatusLabel } from "@/lib/utils";
import type { Event, Attendance, AttendanceSummary, FoodOrderSummary } from "@/types/database";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [foodSummary, setFoodSummary] = useState<FoodOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const { data: eventData } = await supabase
        .from("events")
        .select(`
          *,
          host_family:families(*)
        `)
        .eq("id", id)
        .single();

      setEvent(eventData);

      if (eventData && user?.family?.id) {
        // Fetch user's attendance
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("event_id", id)
          .eq("family_id", user.family.id)
          .single();

        setAttendance(attendanceData);

        // Fetch attendance summary
        const { data: allAttendances } = await supabase
          .from("attendance")
          .select(`
            *,
            family:families(*)
          `)
          .eq("event_id", id);

        if (allAttendances) {
          const summary: AttendanceSummary = {
            total_families: 7, // Total families in group
            coming_families: allAttendances.filter(a => a.status === 'yes').length,
            not_coming_families: allAttendances.filter(a => a.status === 'no').length,
            maybe_families: allAttendances.filter(a => a.status === 'maybe').length,
            pending_responses: 7 - allAttendances.length,
            total_adults: allAttendances.reduce((sum, a) => sum + (a.status === 'yes' ? a.adults_count : 0), 0),
            total_children: allAttendances.reduce((sum, a) => sum + (a.status === 'yes' ? a.children_count : 0), 0),
          };
          setAttendanceSummary(summary);

          // Fetch food orders summary
          const { data: foodOrders } = await supabase
            .from("food_orders")
            .select(`
              *,
              menu_item:menu_items(*)
            `)
            .eq("event_id", id);

          if (foodOrders) {
            const orderMap: Record<string, FoodOrderSummary> = {};
            foodOrders.forEach(order => {
              if (order.menu_item) {
                if (!orderMap[order.menu_item_id]) {
                  orderMap[order.menu_item_id] = {
                    menu_item_id: order.menu_item_id,
                    menu_item_name: order.menu_item.name,
                    category_type: order.menu_item.category_id,
                    total_quantity: 0,
                    families_ordered: 0,
                  };
                }
                orderMap[order.menu_item_id].total_quantity += order.quantity;
              }
            });
            setFoodSummary(Object.values(orderMap));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (status: 'yes' | 'no' | 'maybe') => {
    setRsvpLoading(true);
    try {
      if (attendance) {
        // Update existing attendance
        await supabase
          .from("attendance")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", attendance.id);
      } else {
        // Create new attendance
        await supabase
          .from("attendance")
          .insert({
            event_id: id,
            family_id: user?.family?.id,
            status,
            adults_count: 0,
            children_count: 0,
          });
      }
      
      await fetchEventData();
      router.push(`/events/${id}/rsvp`);
    } catch (error) {
      console.error("Error updating RSVP:", error);
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Event not found</h2>
        <Link href="/events">
          <Button className="mt-4 btn-primary">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const canOrder = !event.is_ordering_closed && !isPast;
  const orderDeadline = new Date(event.last_order_date);
  const isDeadlinePassed = orderDeadline < new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{event.name}</h1>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
            {getEventTypeLabel(event.type)}
          </span>
        </div>
        {(user?.role === "admin" || user?.role === "captain") && (
          <Link href={`/events/${id}/edit`}>
            <Button variant="ghost" size="icon">
              <Edit className="w-5 h-5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Event Details Card */}
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex flex-col items-center justify-center text-white">
              <span className="text-xs font-medium">
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="text-2xl font-bold">
                {new Date(event.date).getDate()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{formatDate(event.date)}</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatTime(event.time)}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            {event.restaurant && (
              <div className="flex items-start gap-3">
                <Utensils className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{event.restaurant}</p>
                  {event.address && (
                    <p className="text-sm text-muted-foreground">{event.address}</p>
                  )}
                </div>
              </div>
            )}

            {event.host_family && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <p>Hosted by <span className="font-medium">{event.host_family.name}</span></p>
              </div>
            )}

            {event.map_url && (
              <a 
                href={event.map_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-primary hover:underline"
              >
                <MapPin className="w-5 h-5" />
                <span>View on Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {event.notes && (
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* RSVP Section */}
      {!isPast && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Will you attend?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleRsvp('yes')}
                disabled={rsvpLoading}
                className={`h-auto py-4 flex-col gap-2 ${
                  attendance?.status === 'yes' 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'btn-primary'
                }`}
              >
                <CheckCircle className="w-6 h-6" />
                <span>Yes</span>
              </Button>
              <Button
                onClick={() => handleRsvp('no')}
                disabled={rsvpLoading}
                className={`h-auto py-4 flex-col gap-2 ${
                  attendance?.status === 'no' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'btn-outline'
                }`}
              >
                <XCircle className="w-6 h-6" />
                <span>No</span>
              </Button>
              <Button
                onClick={() => handleRsvp('maybe')}
                disabled={rsvpLoading}
                className={`h-auto py-4 flex-col gap-2 ${
                  attendance?.status === 'maybe' 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'btn-secondary'
                }`}
              >
                <HelpCircle className="w-6 h-6" />
                <span>Maybe</span>
              </Button>
            </div>

            {attendance?.status === 'yes' && canOrder && !isDeadlinePassed && (
              <Link href={`/events/${id}/rsvp`}>
                <Button className="w-full btn-primary mt-4">
                  <Utensils className="w-5 h-5 mr-2" />
                  Place Food Order
                </Button>
              </Link>
            )}

            {event.is_ordering_closed && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Ordering has been closed by the host
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Summary */}
      {attendanceSummary && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-emerald-500/10">
                <p className="text-3xl font-bold text-emerald-500">
                  {attendanceSummary.coming_families}
                </p>
                <p className="text-sm text-muted-foreground">Coming</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-red-500/10">
                <p className="text-3xl font-bold text-red-500">
                  {attendanceSummary.not_coming_families}
                </p>
                <p className="text-sm text-muted-foreground">Not Coming</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-500/10">
                <p className="text-3xl font-bold text-amber-500">
                  {attendanceSummary.maybe_families}
                </p>
                <p className="text-sm text-muted-foreground">Maybe</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-500/10">
                <p className="text-3xl font-bold text-gray-500">
                  {attendanceSummary.pending_responses}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Adults</span>
                <span className="font-bold">{attendanceSummary.total_adults}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Children</span>
                <span className="font-bold">{attendanceSummary.total_children}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Food Summary */}
      {foodSummary.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              Food Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {foodSummary.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span>{item.menu_item_name}</span>
                  <span className="font-bold">×{item.total_quantity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => setShowQrModal(true)}
        >
          <QrCode className="w-5 h-5 mr-2" />
          QR Code
        </Button>
        <Link href={`/events/${id}/share`} className="flex-1">
          <Button className="w-full btn-secondary">
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </Button>
        </Link>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-center">Event QR Code</h3>
            <div className="bg-white p-4 rounded-xl flex items-center justify-center">
              {/* QR Code would be generated here */}
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                <QrCode className="w-32 h-32 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Scan to view event details
            </p>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => setShowQrModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
