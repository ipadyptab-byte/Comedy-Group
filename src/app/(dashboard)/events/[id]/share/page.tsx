"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, MessageCircle, Printer, FileText, Check, Loader2 } from "lucide-react";
import { generateWhatsAppMessage } from "@/lib/utils";
import type { Event, AttendanceSummary, FoodOrderSummary, SpecialInstructionSummary } from "@/types/database";

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [foodSummary, setFoodSummary] = useState<FoodOrderSummary[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<SpecialInstructionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      setEvent(eventData);

      if (eventData) {
        // Fetch attendance
        const { data: allAttendances } = await supabase
          .from("attendance")
          .select("*")
          .eq("event_id", id);

        if (allAttendances) {
          const summary: AttendanceSummary = {
            total_families: 7,
            coming_families: allAttendances.filter(a => a.status === 'yes').length,
            not_coming_families: allAttendances.filter(a => a.status === 'no').length,
            maybe_families: allAttendances.filter(a => a.status === 'maybe').length,
            pending_responses: 7 - allAttendances.length,
            total_adults: allAttendances.reduce((sum, a) => sum + (a.status === 'yes' ? a.adults_count : 0), 0),
            total_children: allAttendances.reduce((sum, a) => sum + (a.status === 'yes' ? a.children_count : 0), 0),
          };
          setAttendanceSummary(summary);
        }

        // Fetch food orders with menu items
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
                  category_type: 'starter',
                  total_quantity: 0,
                  families_ordered: 0,
                };
              }
              orderMap[order.menu_item_id].total_quantity += order.quantity;
            }
          });
          setFoodSummary(Object.values(orderMap).sort((a, b) => b.total_quantity - a.total_quantity));
        }

        // Fetch special instructions
        const { data: instructions } = await supabase
          .from("special_instructions")
          .select("*")
          .eq("event_id", id);

        if (instructions) {
          const instructionMap: Record<string, number> = {};
          instructions.forEach(inst => {
            if (inst.instruction.trim()) {
              instructionMap[inst.instruction] = (instructionMap[inst.instruction] || 0) + 1;
            }
          });
          setSpecialInstructions(
            Object.entries(instructionMap).map(([instruction, count]) => ({
              instruction,
              count,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!event || !attendanceSummary) return;
    
    const message = generateWhatsAppMessage(
      event.name,
      event.date,
      {
        coming: attendanceSummary.coming_families,
        notComing: attendanceSummary.not_coming_families,
        adults: attendanceSummary.total_adults,
        children: attendanceSummary.total_children,
      },
      foodSummary.map(f => ({ item: f.menu_item_name, quantity: f.total_quantity })),
      specialInstructions
    );

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!event || !attendanceSummary) return;
    
    const message = generateWhatsAppMessage(
      event.name,
      event.date,
      {
        coming: attendanceSummary.coming_families,
        notComing: attendanceSummary.not_coming_families,
        adults: attendanceSummary.total_adults,
        children: attendanceSummary.total_children,
      },
      foodSummary.map(f => ({ item: f.menu_item_name, quantity: f.total_quantity })),
      specialInstructions
    );

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    // Simple implementation - opens print dialog which can be saved as PDF
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || !attendanceSummary) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Unable to load summary</h2>
        <Link href={`/events/${id}`}>
          <Button className="mt-4 btn-primary">Back to Event</Button>
        </Link>
      </div>
    );
  }

  const message = generateWhatsAppMessage(
    event.name,
    event.date,
    {
      coming: attendanceSummary.coming_families,
      notComing: attendanceSummary.not_coming_families,
      adults: attendanceSummary.total_adults,
      children: attendanceSummary.total_children,
    },
    foodSummary.map(f => ({ item: f.menu_item_name, quantity: f.total_quantity })),
    specialInstructions
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Share Summary</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-4">Order Summary Preview</h2>
          
          <div className="space-y-4">
            {/* Event Info */}
            <div className="text-center pb-4 border-b border-border">
              <h3 className="text-xl font-bold">🍽️ Comedy Group {event.name}</h3>
              <p className="text-muted-foreground">
                📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Attendance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
                <p className="text-2xl font-bold text-emerald-500">{attendanceSummary.coming_families}</p>
                <p className="text-xs text-muted-foreground">Coming</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 text-center">
                <p className="text-2xl font-bold text-red-500">{attendanceSummary.not_coming_families}</p>
                <p className="text-xs text-muted-foreground">Not Coming</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-center">
                <p className="text-2xl font-bold text-blue-500">{attendanceSummary.total_adults}</p>
                <p className="text-xs text-muted-foreground">Adults</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-center">
                <p className="text-2xl font-bold text-purple-500">{attendanceSummary.total_children}</p>
                <p className="text-xs text-muted-foreground">Children</p>
              </div>
            </div>

            {/* Food Orders */}
            {foodSummary.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2">🍴 Food Order</h4>
                <div className="space-y-1">
                  {foodSummary.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.menu_item_name}</span>
                      <span className="font-bold">×{item.total_quantity}</span>
                    </div>
                  ))}
                  {foodSummary.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      +{foodSummary.length - 10} more items...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {specialInstructions.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2">📝 Special Notes</h4>
                <div className="space-y-1">
                  {specialInstructions.slice(0, 5).map((inst, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{inst.instruction}</span>
                      <span className="font-bold">×{inst.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Preview */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">WhatsApp Message</h3>
          <div className="p-3 bg-muted rounded-xl text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
            {message}
          </div>
        </CardContent>
      </Card>

      {/* Share Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={handleCopy} className="btn-primary h-auto py-4 flex-col gap-2">
          {copied ? (
            <>
              <Check className="w-6 h-6" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-6 h-6" />
              <span>Copy</span>
            </>
          )}
        </Button>
        <Button onClick={handleWhatsApp} className="btn-secondary h-auto py-4 flex-col gap-2">
          <MessageCircle className="w-6 h-6" />
          <span>WhatsApp</span>
        </Button>
        <Button onClick={handlePrint} variant="outline" className="h-auto py-4 flex-col gap-2">
          <Printer className="w-6 h-6" />
          <span>Print</span>
        </Button>
        <Button onClick={handleDownloadPdf} variant="outline" className="h-auto py-4 flex-col gap-2">
          <FileText className="w-6 h-6" />
          <span>Save PDF</span>
        </Button>
      </div>
    </div>
  );
}
