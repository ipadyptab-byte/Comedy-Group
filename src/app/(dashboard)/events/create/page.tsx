"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, PartyPopper, Calendar, Clock, MapPin, Utensils, FileText } from "lucide-react";
import type { EventType, Family } from "@/types/database";

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "anniversary", label: "Anniversary", emoji: "💕" },
  { value: "holiday_dinner", label: "Holiday Dinner", emoji: "🎄" },
  { value: "festival", label: "Festival Celebration", emoji: "🪔" },
  { value: "weekend_dinner", label: "Weekend Dinner", emoji: "🏠" },
  { value: "regular_dinner", label: "Regular Dinner", emoji: "🍽️" },
  { value: "other", label: "Other", emoji: "📌" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [fetchingFamilies, setFetchingFamilies] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    type: "regular_dinner" as EventType,
    host_family_id: "",
    date: "",
    time: "19:00",
    restaurant: "",
    address: "",
    map_url: "",
    last_order_date: "",
    notes: "",
  });

  useEffect(() => {
    if (user?.role !== "admin" && user?.role !== "captain") {
      router.push("/dashboard");
      return;
    }
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const { data } = await supabase
        .from("families")
        .select("*")
        .order("name");
      setFamilies(data || []);
      
      // Set default host family to user's family
      if (user?.family?.id) {
        setFormData(prev => ({ ...prev, host_family_id: user.family!.id }));
      }
    } catch (error) {
      console.error("Error fetching families:", error);
    } finally {
      setFetchingFamilies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: memberData } = await supabase
        .from("members")
        .select("id")
        .eq("family_id", user?.family?.id)
        .single();

      const { error } = await supabase.from("events").insert({
        name: formData.name,
        type: formData.type,
        host_family_id: formData.host_family_id,
        date: formData.date,
        time: formData.time,
        restaurant: formData.restaurant || null,
        address: formData.address || null,
        map_url: formData.map_url || null,
        last_order_date: formData.last_order_date,
        notes: formData.notes || null,
        created_by: memberData?.id || null,
      });

      if (error) throw error;

      router.push("/events");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "captain") {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Create Event</h1>
          <p className="text-sm text-muted-foreground">Plan a new gathering</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sharma Family Birthday"
                required
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label>Event Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.type === type.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-2xl mr-2">{type.emoji}</span>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Host Family *</Label>
              <Select
                value={formData.host_family_id}
                onValueChange={(value) => setFormData({ ...formData, host_family_id: value })}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select host family" />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              Restaurant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant">Restaurant Name</Label>
              <Input
                id="restaurant"
                value={formData.restaurant}
                onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                placeholder="e.g., Spice Garden"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Restaurant address"
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="map_url">Google Maps Link</Label>
              <Input
                id="map_url"
                type="url"
                value={formData.map_url}
                onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="input-field"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Order Deadline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="last_order_date">Last Date & Time to Submit Order *</Label>
              <Input
                id="last_order_date"
                type="datetime-local"
                value={formData.last_order_date}
                onChange={(e) => setFormData({ ...formData, last_order_date: e.target.value })}
                required
                className="input-field"
              />
              <p className="text-sm text-muted-foreground">
                Members will not be able to order after this time
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes for Guests</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or information..."
                className="input-field min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full btn-primary"
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating Event...
            </>
          ) : (
            <>
              <PartyPopper className="w-5 h-5 mr-2" />
              Create Event
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
