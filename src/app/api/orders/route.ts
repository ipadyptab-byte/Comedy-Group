import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  
  try {
    let query = supabase
      .from("food_orders")
      .select(`
        *,
        menu_item:menu_items(*)
      `);

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate orders by menu item
    const aggregated: Record<string, { 
      menu_item_id: string; 
      menu_item_name: string; 
      total_quantity: number 
    }> = {};

    data?.forEach(order => {
      if (order.menu_item) {
        if (!aggregated[order.menu_item_id]) {
          aggregated[order.menu_item_id] = {
            menu_item_id: order.menu_item_id,
            menu_item_name: order.menu_item.name,
            total_quantity: 0,
          };
        }
        aggregated[order.menu_item_id].total_quantity += order.quantity;
      }
    });

    return NextResponse.json({ 
      data,
      summary: Object.values(aggregated)
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const { event_id, family_id, items } = body;
    
    // Delete existing orders for this family/event
    await supabase
      .from("food_orders")
      .delete()
      .eq("event_id", event_id)
      .eq("family_id", family_id);

    // Insert new orders
    if (items && items.length > 0) {
      const ordersToInsert = items.map((item: { menu_item_id: string; quantity: number }) => ({
        event_id,
        family_id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }));

      const { data, error } = await supabase
        .from("food_orders")
        .insert(ordersToInsert)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data }, { status: 201 });
    }

    return NextResponse.json({ message: "Orders saved successfully" }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
