// Database Types for Comedy Group Planner

export type UserRole = 'admin' | 'captain' | 'member';

export type EventType = 
  | 'birthday' 
  | 'anniversary' 
  | 'holiday_dinner' 
  | 'festival' 
  | 'weekend_dinner' 
  | 'regular_dinner' 
  | 'other';

export type AttendanceStatus = 'yes' | 'no' | 'maybe';

export type DeclineReason = 'out_of_station' | 'busy' | 'sick' | 'other';

export type NotificationType = 
  | 'new_event' 
  | 'reminder' 
  | 'order_submitted' 
  | 'event_tomorrow' 
  | 'event_today';

export type MenuCategoryType = 
  | 'starter' 
  | 'main_course' 
  | 'roti' 
  | 'rice' 
  | 'dessert' 
  | 'drinks';

export interface Family {
  id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  address: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  family?: Family;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  host_family_id: string;
  date: string;
  time: string;
  restaurant: string | null;
  address: string | null;
  map_url: string | null;
  last_order_date: string;
  notes: string | null;
  is_ordering_closed: boolean;
  created_by: string;
  created_at: string;
  host_family?: Family;
  creator?: Member;
}

export interface Attendance {
  id: string;
  event_id: string;
  family_id: string;
  status: AttendanceStatus;
  adults_count: number;
  children_count: number;
  reason: string | null;
  submitted_at: string;
  updated_at: string;
  family?: Family;
}

export interface MenuCategory {
  id: string;
  name: string;
  type: MenuCategoryType;
  display_order: number;
  is_active: boolean;
  created_at: string;
  menu_items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  category?: MenuCategory;
}

export interface FoodOrder {
  id: string;
  event_id: string;
  family_id: string;
  menu_item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
}

export interface SpecialInstruction {
  id: string;
  event_id: string;
  family_id: string;
  instruction: string;
  created_at: string;
}

export interface Notification {
  id: string;
  event_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  event?: Event;
}

export interface EventPhoto {
  id: string;
  event_id: string;
  photo_url: string;
  uploaded_by: string;
  created_at: string;
}

// Summary Types
export interface AttendanceSummary {
  total_families: number;
  coming_families: number;
  not_coming_families: number;
  maybe_families: number;
  pending_responses: number;
  total_adults: number;
  total_children: number;
}

export interface FoodOrderSummary {
  menu_item_id: string;
  menu_item_name: string;
  category_type: MenuCategoryType;
  total_quantity: number;
  families_ordered: number;
}

export interface SpecialInstructionSummary {
  instruction: string;
  count: number;
}

export interface EventSummary {
  attendance: AttendanceSummary;
  food_orders: FoodOrderSummary[];
  special_instructions: SpecialInstructionSummary[];
}

// User Session
export interface UserSession {
  id: string;
  user_id: string;
  family_id: string;
  created_at: string;
  family?: Family;
  member?: Member;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Event Form Data
export interface CreateEventInput {
  name: string;
  type: EventType;
  host_family_id: string;
  date: string;
  time: string;
  restaurant?: string;
  address?: string;
  map_url?: string;
  last_order_date: string;
  notes?: string;
}

export interface RsvpInput {
  status: AttendanceStatus;
  adults_count: number;
  children_count: number;
  reason?: string;
}

export interface OrderInput {
  items: {
    menu_item_id: string;
    quantity: number;
  }[];
  special_instructions?: string;
}

// Dashboard Stats
export interface DashboardStats {
  upcoming_events: number;
  pending_responses: number;
  previous_events: number;
  unread_notifications: number;
}
