"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Bell, Send, Loader2, Users, Calendar } from "lucide-react";
import type { Event, NotificationType } from "@/types/database";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    event_id: "",
    type: "new_event" as NotificationType,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("date", today)
        .order("date");

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim()) return;
    setSending(true);
    try {
      await supabase.from("notifications").insert({
        event_id: formData.event_id || null,
        type: formData.type,
        title: formData.title,
        message: formData.message || null,
      });
      setFormData({ event_id: "", type: "new_event", title: "", message: "" });
      setShowSendModal(false);
      alert("Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification");
    } finally {
      setSending(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Send notifications to all members</p>
        </div>
        <Button onClick={() => setShowSendModal(true)} className="btn-primary">
          <Send className="w-4 h-4 mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Info Card */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Notification Types</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Send different types of notifications to keep members informed
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    New Event
                  </p>
                  <p className="text-xs text-muted-foreground">When you create a new event</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Reminder
                  </p>
                  <p className="text-xs text-muted-foreground">Before order deadline</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Event Tomorrow
                  </p>
                  <p className="text-xs text-muted-foreground">Day before event</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Event Today
                  </p>
                  <p className="text-xs text-muted-foreground">Day of the event</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as NotificationType })}
              >
                <SelectTrigger className="input-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_event">New Event Created</SelectItem>
                  <SelectItem value="reminder">Order Reminder</SelectItem>
                  <SelectItem value="event_tomorrow">Event Tomorrow</SelectItem>
                  <SelectItem value="event_today">Event Today</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Related Event (Optional)</Label>
              <Select
                value={formData.event_id}
                onValueChange={(value) => setFormData({ ...formData, event_id: value })}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} - {new Date(event.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Additional message (optional)"
                className="input-field min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !formData.title.trim()}
              className="btn-primary"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
