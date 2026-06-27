-- Comedy Group Planner Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table (one login per family)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table (individual adults within families)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'captain', 'member')) DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('birthday', 'anniversary', 'holiday_dinner', 'festival', 'weekend_dinner', 'regular_dinner', 'other')) NOT NULL,
  host_family_id UUID REFERENCES families(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  restaurant TEXT,
  address TEXT,
  map_url TEXT,
  last_order_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  is_ordering_closed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('yes', 'no', 'maybe')) NOT NULL,
  adults_count INTEGER DEFAULT 0 CHECK (adults_count >= 0),
  children_count INTEGER DEFAULT 0 CHECK (children_count >= 0),
  reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, family_id)
);

-- Menu categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('starter', 'main_course', 'roti', 'rice', 'dessert', 'drinks')) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food orders
CREATE TABLE food_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, family_id, menu_item_id)
);

-- Special instructions
CREATE TABLE special_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('new_event', 'reminder', 'order_submitted', 'event_tomorrow', 'event_today')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event photos (optional)
CREATE TABLE event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User family mappings (for Supabase Auth integration)
CREATE TABLE user_families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_family_id ON attendance(family_id);
CREATE INDEX idx_food_orders_event_id ON food_orders(event_id);
CREATE INDEX idx_food_orders_family_id ON food_orders(family_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_host_family ON events(host_family_id);
CREATE INDEX idx_notifications_event_id ON notifications(event_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_families ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Families: Users can read all families, admin can modify
CREATE POLICY "Public can view families" ON families FOR SELECT USING (true);
CREATE POLICY "Admin can manage families" ON families FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- Members: Public can view, admin can modify
CREATE POLICY "Public can view members" ON members FOR SELECT USING (true);
CREATE POLICY "Admin can manage members" ON members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- Events: All authenticated users can view, captains/admins can modify
CREATE POLICY "Authenticated can view events" ON events FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_families WHERE user_id = auth.uid())
);
CREATE POLICY "Captain/Admin can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role IN ('admin', 'captain')
  )
);
CREATE POLICY "Captain/Admin can update events" ON events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role IN ('admin', 'captain')
  )
);
CREATE POLICY "Admin can delete events" ON events FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- Attendance: Users can manage their family's attendance
CREATE POLICY "Users can view attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Users can create attendance for their family" ON attendance FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = attendance.family_id
  )
);
CREATE POLICY "Users can update attendance for their family" ON attendance FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = attendance.family_id
  )
);

-- Menu categories and items: Public read, admin write
CREATE POLICY "Public can view menu categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage menu categories" ON menu_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);

CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin can manage menu items" ON menu_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- Food orders: Users can manage their family's orders
CREATE POLICY "Users can view food orders" ON food_orders FOR SELECT USING (true);
CREATE POLICY "Users can create orders for their family" ON food_orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = food_orders.family_id
  )
);
CREATE POLICY "Users can update orders for their family" ON food_orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = food_orders.family_id
  )
);
CREATE POLICY "Users can delete orders for their family" ON food_orders FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = food_orders.family_id
  )
);

-- Special instructions: Users can manage their family's instructions
CREATE POLICY "Users can view special instructions" ON special_instructions FOR SELECT USING (true);
CREATE POLICY "Users can create instructions for their family" ON special_instructions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = special_instructions.family_id
  )
);
CREATE POLICY "Users can update instructions for their family" ON special_instructions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_families 
    WHERE user_id = auth.uid() AND family_id = special_instructions.family_id
  )
);

-- Notifications: Users can view and update their own notifications
CREATE POLICY "Users can view notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Admin can create notifications" ON notifications FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (true);

-- Event photos: Users can view, creators can manage
CREATE POLICY "Public can view event photos" ON event_photos FOR SELECT USING (true);
CREATE POLICY "Users can upload photos" ON event_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_families WHERE user_id = auth.uid())
);

-- User families: Users can view their own
CREATE POLICY "Users can view their own family mapping" ON user_families FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Admin can manage family mappings" ON user_families FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_families uf
    JOIN members m ON uf.member_id = m.id
    WHERE uf.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- Functions

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update triggers
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_orders_updated_at
  BEFORE UPDATE ON food_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Data: Sample Menu Categories
INSERT INTO menu_categories (name, type, display_order) VALUES
  ('Starters', 'starter', 1),
  ('Main Course', 'main_course', 2),
  ('Breads & Rotis', 'roti', 3),
  ('Rice & Biryani', 'rice', 4),
  ('Desserts', 'dessert', 5),
  ('Drinks', 'drinks', 6);

-- Seed Data: Sample Menu Items
INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Masala Papad', 'Crispy papad with spices' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Roasted Papad', 'Roasted crispy papad' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Tomato Soup', 'Hot tomato soup' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Manchow Soup', 'Spicy manchow soup with crispy noodles' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Sweet Corn Soup', 'Creamy sweet corn soup' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Hot & Sour Soup', 'Spicy and tangy soup' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Paneer Chilli', 'Crispy paneer in spicy sauce' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Paneer Tikka', 'Grilled paneer marinated in spices' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Veg Crispy', 'Crispy vegetables' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Veg Manchurian', 'Fried vegetable balls in manchurian sauce' FROM menu_categories WHERE name = 'Starters';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'French Fries', 'Crispy golden fries' FROM menu_categories WHERE name = 'Starters';

-- Main Course items
INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Paneer Butter Masala', 'Paneer in creamy tomato butter sauce' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Kadai Paneer', 'Paneer cooked with bell peppers in kadai masala' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Veg Kolhapuri', 'Spicy mixed vegetable curry' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Veg Handi', 'Slow cooked vegetable curry' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Mix Veg', 'Mixed vegetable curry' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Dal Fry', 'Fried lentil curry' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Dal Tadka', 'Lentils with tempered spices' FROM menu_categories WHERE name = 'Main Course';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Jeera Aloo', 'Cumin flavored potato curry' FROM menu_categories WHERE name = 'Main Course';

-- Roti items
INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Plain Roti', 'Simple wheat flatbread' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Butter Roti', 'Roti with butter' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Chapati', 'Whole wheat flatbread' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Plain Naan', 'Leavened bread' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Butter Naan', 'Naan with butter' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Butter Kulcha', 'Kulcha with butter' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Garlic Naan', 'Naan with garlic' FROM menu_categories WHERE name = 'Breads & Rotis';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Tandoori Roti', 'Tandoor baked roti' FROM menu_categories WHERE name = 'Breads & Rotis';

-- Rice items
INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Plain Rice', 'Steamed white rice' FROM menu_categories WHERE name = 'Rice & Biryani';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Jeera Rice', 'Rice with cumin' FROM menu_categories WHERE name = 'Rice & Biryani';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Veg Biryani', 'Vegetable biryani' FROM menu_categories WHERE name = 'Rice & Biryani';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Steam Rice', 'Steamed basmati rice' FROM menu_categories WHERE name = 'Rice & Biryani';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Dal Khichdi', 'Rice and lentil dish' FROM menu_categories WHERE name = 'Rice & Biryani';

-- Dessert items
INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Ice Cream', 'Assorted ice cream flavors' FROM menu_categories WHERE name = 'Desserts';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Gulab Jamun', 'Sweet milk dumplings in sugar syrup' FROM menu_categories WHERE name = 'Desserts';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Brownie', 'Chocolate brownie' FROM menu_categories WHERE name = 'Desserts';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Rabdi', 'Sweet thickened milk' FROM menu_categories WHERE name = 'Desserts';

-- Drink items
INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Water', 'Mineral water' FROM menu_categories WHERE name = 'Drinks';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Soft Drink', 'Assorted soft drinks' FROM menu_categories WHERE name = 'Drinks';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Lime Soda', 'Sweet lime soda' FROM menu_categories WHERE name = 'Drinks';

INSERT INTO menu_items (category_id, name, description) 
SELECT id, 'Buttermilk', 'Spiced buttermilk' FROM menu_categories WHERE name = 'Drinks';

-- Create a sample admin family (you can update this later)
-- Note: You'll need to create a user in Supabase Auth separately
