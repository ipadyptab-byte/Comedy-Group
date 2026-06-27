"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Loader2, Minus, Plus, Users, Baby } from "lucide-react";
import type { Event, Attendance } from "@/types/database";

export default function RsvpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [step, setStep] = useState<"status" | "count" | "reason" | "order">("status");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<"yes" | "no" | "maybe">("yes");
  const [adultsCount, setAdultsCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [declineReason, setDeclineReason] = useState<string>("");
  const [declineReasonOther, setDeclineReasonOther] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      setEvent(eventData);

      if (eventData && user?.family?.id) {
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("event_id", id)
          .eq("family_id", user.family.id)
          .single();

        if (attendanceData) {
          setAttendance(attendanceData);
          setStatus(attendanceData.status);
          setAdultsCount(attendanceData.adults_count);
          setChildrenCount(attendanceData.children_count);
          setDeclineReason(attendanceData.reason || "");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "yes" | "no" | "maybe") => {
    setSaving(true);
    try {
      if (attendance) {
        await supabase
          .from("attendance")
          .update({ status: newStatus })
          .eq("id", attendance.id);
      } else {
        const { data: newAttendance } = await supabase
          .from("attendance")
          .insert({
            event_id: id,
            family_id: user?.family?.id,
            status: newStatus,
            adults_count: 0,
            children_count: 0,
          })
          .select()
          .single();
        
        setAttendance(newAttendance);
      }
      
      setStatus(newStatus);
      
      if (newStatus === "yes" || newStatus === "maybe") {
        setStep("count");
      } else {
        setStep("reason");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCountSubmit = async () => {
    setSaving(true);
    try {
      if (attendance) {
        await supabase
          .from("attendance")
          .update({
            adults_count: adultsCount,
            children_count: childrenCount,
          })
          .eq("id", attendance.id);
      }
      setStep("order");
    } catch (error) {
      console.error("Error updating counts:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReasonSubmit = async () => {
    setSaving(true);
    try {
      const reason = declineReason === "other" ? declineReasonOther : declineReason;
      if (attendance) {
        await supabase
          .from("attendance")
          .update({ reason })
          .eq("id", attendance.id);
      }
      router.push(`/events/${id}`);
    } catch (error) {
      console.error("Error updating reason:", error);
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">RSVP</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>

      {step === "status" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-center">Will you attend?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleStatusChange("yes")}
                disabled={saving}
                className="h-20 text-lg btn-primary"
              >
                <CheckCircle className="w-6 h-6 mr-3" />
                Yes, we will come!
              </Button>
              <Button
                onClick={() => handleStatusChange("no")}
                disabled={saving}
                className="h-20 text-lg btn-outline border-red-500 text-red-500 hover:bg-red-500/10"
              >
                Sorry, cannot make it
              </Button>
              <Button
                onClick={() => handleStatusChange("maybe")}
                disabled={saving}
                className="h-20 text-lg btn-secondary"
              >
                Maybe, still deciding
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "count" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-center">How many are coming?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Adults
              </Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdultsCount(Math.max(0, adultsCount - 1))}
                  disabled={adultsCount === 0}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-4xl font-bold w-16 text-center">{adultsCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdultsCount(Math.min(10, adultsCount + 1))}
                  disabled={adultsCount === 10}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-secondary" />
                Children
              </Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                  disabled={childrenCount === 0}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-4xl font-bold w-16 text-center">{childrenCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setChildrenCount(Math.min(10, childrenCount + 1))}
                  disabled={childrenCount === 10}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleCountSubmit}
              disabled={saving || (adultsCount === 0 && childrenCount === 0)}
              className="w-full btn-primary"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Continue to Order"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "reason" && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-center">We are sorry to miss it!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>What is the reason?</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="out_of_station">Out of Station</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {declineReason === "other" && (
              <div className="space-y-2">
                <Label>Please specify</Label>
                <Input
                  value={declineReasonOther}
                  onChange={(e) => setDeclineReasonOther(e.target.value)}
                  placeholder="Enter reason..."
                  className="input-field"
                />
              </div>
            )}

            <Button
              onClick={handleReasonSubmit}
              disabled={saving || (declineReason === "other" && !declineReasonOther)}
              className="w-full btn-primary"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Submit"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "order" && (
        <Card className="glass-card">
          <CardContent className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Great!</h3>
              <p className="text-muted-foreground mt-1">
                {adultsCount + childrenCount} {(adultsCount + childrenCount) === 1 ? "person" : "people"} confirmed
              </p>
            </div>
            <Link href={`/orders/${id}`}>
              <Button className="w-full btn-primary">Place Food Order</Button>
            </Link>
            <Link href={`/events/${id}`}>
              <Button variant="outline" className="w-full">Back to Event</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
