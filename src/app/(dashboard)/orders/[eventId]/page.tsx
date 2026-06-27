"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Minus, Plus, Utensils, ShoppingCart, Check, ChevronRight, AlertCircle } from "lucide-react";
import type { Event, MenuCategory, MenuItem, FoodOrder } from "@/types/database";

export default function OrderPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [existingOrders, setExistingOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      // Fetch event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      setEvent(eventData);

      // Fetch menu categories
      const { data: categoriesData } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      setCategories(categoriesData || []);
      if (categoriesData?.length) {
        setActiveCategory(categoriesData[0].id);
      }

      // Fetch menu items
      const { data: itemsData } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_active", true);

      setMenuItems(itemsData || []);

      // Fetch existing orders for this family
      if (eventData && user?.family?.id) {
        const { data: ordersData } = await supabase
          .from("food_orders")
          .select("*")
          .eq("event_id", eventId)
          .eq("family_id", user.family.id);

        if (ordersData) {
          setExistingOrders(ordersData);
          const qtyMap: Record<string, number> = {};
          ordersData.forEach(order => {
            qtyMap[order.menu_item_id] = order.quantity;
          });
          setQuantities(qtyMap);
        }

        // Fetch special instructions
        const { data: instructionsData } = await supabase
          .from("special_instructions")
          .select("*")
          .eq("event_id", eventId)
          .eq("family_id", user.family.id)
          .single();

        if (instructionsData) {
          setSpecialInstructions(instructionsData.instruction);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[itemId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const setQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setQuantities(prev => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setQuantities(prev => ({ ...prev, [itemId]: qty }));
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const itemIds = Object.keys(quantities);
      
      // Delete existing orders
      await supabase
        .from("food_orders")
        .delete()
        .eq("event_id", eventId)
        .eq("family_id", user?.family?.id);

      // Insert new orders
      const ordersToInsert = itemIds.map(itemId => ({
        event_id: eventId,
        family_id: user?.family?.id,
        menu_item_id: itemId,
        quantity: quantities[itemId],
      }));

      if (ordersToInsert.length > 0) {
        await supabase.from("food_orders").insert(ordersToInsert);
      }

      // Update special instructions
      if (specialInstructions.trim()) {
        // Delete existing
        await supabase
          .from("special_instructions")
          .delete()
          .eq("event_id", eventId)
          .eq("family_id", user?.family?.id);

        // Insert new
        await supabase.from("special_instructions").insert({
          event_id: eventId,
          family_id: user?.family?.id,
          instruction: specialInstructions,
        });
      }

      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryItems = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  const getCategoryLabel = (type: string) => {
    const labels: Record<string, string> = {
      starter: "🍽️ Starters",
      main_course: "🍛 Main Course",
      roti: "🫓 Breads & Rotis",
      rice: "🍚 Rice & Biryani",
      dessert: "🍰 Desserts",
      drinks: "🥤 Drinks",
    };
    return labels[type] || type;
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

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

  if (event.is_ordering_closed) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href={`/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Food Order</h1>
        </div>
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h3 className="text-xl font-bold">Ordering Closed</h3>
            <p className="text-muted-foreground mt-2">
              The ordering deadline has passed for this event.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentItems = activeCategory ? getCategoryItems(activeCategory) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Food Order</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSummary(true)}
          className="relative"
        >
          <ShoppingCart className="w-4 h-4 mr-1" />
          Cart
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium ${
              activeCategory === category.id
                ? "gradient-primary text-white shadow-lg"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {getCategoryLabel(category.type)}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {currentItems.map((item) => {
          const qty = quantities[item.id] || 0;
          return (
            <Card key={item.id} className={`glass-card transition-all ${qty > 0 ? 'border-primary/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10"
                      onClick={() => handleQuantityChange(item.id, -1)}
                      disabled={qty === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">
                      {qty}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {qty > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(item.id, qty + 1)}
                      className="text-primary"
                    >
                      + Add more
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Special Instructions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Special Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g., Less spicy, No onion, Jain food, Baby food, Extra butter..."
            className="input-field min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Let us know about any dietary preferences or special requirements
          </p>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        className="w-full btn-primary"
        size="lg"
        onClick={handleSaveOrder}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : totalItems > 0 ? (
          <Check className="w-5 h-5 mr-2" />
        ) : (
          <Utensils className="w-5 h-5 mr-2" />
        )}
        {totalItems > 0 ? `Save Order (${totalItems} items)` : "No items selected"}
      </Button>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold">Your Order Summary</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSummary(false)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {categories.map((category) => {
                const items = getCategoryItems(category.id);
                const categoryOrders = items.filter(item => quantities[item.id]);
                if (categoryOrders.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <h3 className="font-medium text-muted-foreground mb-2">
                      {getCategoryLabel(category.type)}
                    </h3>
                    {categoryOrders.map(item => (
                      <div key={item.id} className="flex justify-between py-2 border-b border-border last:border-0">
                        <span>{item.name}</span>
                        <span className="font-bold">×{quantities[item.id]}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              
              {totalItems === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No items selected yet
                </p>
              )}

              {specialInstructions && (
                <div className="mt-4 p-3 bg-muted rounded-xl">
                  <p className="text-sm font-medium">Special Instructions:</p>
                  <p className="text-sm text-muted-foreground">{specialInstructions}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <Button
                className="w-full btn-primary"
                onClick={handleSaveOrder}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                Confirm Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
