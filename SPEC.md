# Comedy Group - Family Dinner & Party Planner PWA

## Project Overview

**Project Name:** Comedy Group Planner  
**Project Type:** Progressive Web Application (PWA)  
**Core Functionality:** A private family event management platform enabling 7 married couples (14 adults + 14 children) to RSVP to events and submit food orders, eliminating WhatsApp message clutter.  
**Target Users:** 7 families in the "Comedy Group" social circle

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 with TypeScript
- **Styling:** Tailwind CSS v4 + ShadCN UI
- **State Management:** React Context + TanStack Query
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts

### Backend
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Database:** Supabase PostgreSQL

### Deployment
- **Hosting:** Vercel
- **CI/CD:** GitHub Actions

---

## User Roles & Permissions

### 1. Admin
- Create/Edit/Delete families
- Create/Edit/Delete members
- Create/Edit/Delete events
- Manage menu categories and items
- Send notifications
- View all reports and analytics
- Share order summaries
- Close ordering after deadline

### 2. Captain/Host
- Create events (Birthday, Anniversary, Holiday Dinner, Festival Celebration, Weekend Dinner, Regular Dinner, Other)
- Enter event details: Name, Type, Host Family, Date, Time, Restaurant, Address, Map Location, Last Order Deadline, Notes
- View attendance and orders for their events

### 3. Family (Member)
- Dashboard: View upcoming events, pending responses, previous events, notifications
- RSVP: Yes/No/Maybe with attendance count
- Food Order: Starter, Main Course, Roti, Rice, Dessert, Drinks with quantities
- Special Instructions text box
- View live summary
- Edit order before deadline

---

## Database Schema (Supabase PostgreSQL)

### Tables

```sql
-- Families table (one login per family)
families (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Members table (individual adults within families)
members (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'captain', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Events table
events (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('birthday', 'anniversary', 'holiday_dinner', 'festival', 'weekend_dinner', 'regular_dinner', 'other')),
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
)

-- Attendance table
attendance (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  family_id UUID REFERENCES families(id),
  status TEXT CHECK (status IN ('yes', 'no', 'maybe')),
  adults_count INTEGER DEFAULT 0,
  children_count INTEGER DEFAULT 0,
  reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, family_id)
)

-- Menu categories
menu_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('starter', 'main_course', 'roti', 'rice', 'dessert', 'drinks')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Menu items
menu_items (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Food orders
food_orders (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  family_id UUID REFERENCES families(id),
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, family_id, menu_item_id)
)

-- Special instructions
special_instructions (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  family_id UUID REFERENCES families(id),
  instruction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  type TEXT CHECK (type IN ('new_event', 'reminder', 'order_submitted', 'event_tomorrow', 'event_today')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Event photos (optional)
event_photos (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  photo_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- User sessions for auth
user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  family_id UUID REFERENCES families(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## UI/UX Design Direction

### Visual Style
- **Design System:** Modern glassmorphism with backdrop blur effects
- **Theme:** Vibrant, celebratory, warm colors suitable for family gatherings
- **Cards:** Glassmorphic cards with subtle shadows and border highlights
- **Icons:** Colorful Lucide icons throughout

### Color Scheme
- **Primary:** Deep Purple (#7C3AED) - Celebratory, premium feel
- **Secondary:** Coral/Orange (#F97316) - Warm, inviting
- **Accent:** Emerald Green (#10B981) - Success, confirmation
- **Background:** 
  - Light: Soft gradient from #F8FAFC to #E0E7FF
  - Dark: Deep gradient from #0F172A to #1E1B4B
- **Glass Effect:** rgba(255, 255, 255, 0.1) with backdrop-blur-xl

### Typography
- **Headings:** Inter (Google Fonts) - Bold, modern
- **Body:** Inter - Clean, readable
- **Font Sizes:** Large, touch-friendly (mobile-first)

### Layout Approach
- **Mobile-first:** Optimized for phone usage
- **Navigation:** Bottom tab bar for main sections (Home, Events, Orders, Profile)
- **Cards:** Full-width cards with generous padding
- **Buttons:** Large, easy-to-tap (min 48px height)
- **Spacing:** Generous whitespace

### Themes
- Light Mode: Default
- Dark Mode: Toggle in header
- System preference detection

---

## Page Structure

### Public Pages
1. **Login Page** - Email/password authentication
2. **Landing Page** - Welcome screen with login

### Dashboard (Home)
1. **Dashboard** - Cards showing:
   - Upcoming Events (count)
   - Pending Responses (count)
   - Previous Events
   - Notifications list

### Events
1. **Events List** - All events (upcoming/previous tabs)
2. **Event Detail** - Full event info
3. **Create Event** (Captain/Admin)
4. **Edit Event** (Admin)
5. **Event QR Code** - Shareable QR

### RSVP & Orders
1. **RSVP Form** - Attendance response
2. **Food Order Form** - Multi-step food selection
3. **Order Summary** - Live summary view
4. **Edit Order** - Before deadline

### Admin Pages
1. **Admin Dashboard** - Overview stats
2. **Families Management** - CRUD families
3. **Members Management** - CRUD members
4. **Menu Management** - Categories & items
5. **Notifications** - Send/view notifications
6. **Reports** - Analytics charts
7. **Share Summary** - WhatsApp/PDF/Print

### Profile
1. **Family Profile** - Photo, details
2. **Settings** - Theme toggle, logout

---

## Core Features

### 1. Authentication
- Supabase Auth with email/password
- Role-based access (admin, captain, member)
- Session management
- Secure password handling

### 2. Event Management
- CRUD operations for events
- Event types with icons
- Date/time picker
- Restaurant details
- Google Maps link
- Order deadline
- Close ordering toggle

### 3. RSVP System
- Yes/No/Maybe response
- Adult count (0-2 for this group)
- Children count (0-4 for this group)
- Reason for decline
- Real-time updates

### 4. Food Ordering
- Categorized menu (Starter, Main, Roti, Rice, Dessert, Drinks)
- Quantity selection per item
- Special instructions text area
- Edit before deadline
- Auto-calculation of totals

### 5. Live Summary
- Real-time attendance count
- Food aggregation by item
- Family breakdown
- Supabase Realtime subscriptions

### 6. Sharing
- WhatsApp-formatted text summary
- Copy to clipboard
- Direct WhatsApp share link
- PDF export
- Print-friendly view

### 7. Notifications
- In-app notifications
- Push notifications (optional)
- WhatsApp notification (link)
- Email notification (optional)

### 8. History & Reports
- Past events archive
- Attendance history
- Order history
- Charts: Most active family, attendance %, popular items

### 9. PWA Features
- Offline support
- Installable (Add to Home Screen)
- Service worker caching
- Fast loading

---

## API Routes (Next.js)

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/events
POST   /api/events
GET    /api/events/[id]
PUT    /api/events/[id]
DELETE /api/events/[id]

POST   /api/events/[id]/rsvp
PUT    /api/events/[id]/rsvp
GET    /api/events/[id]/attendance
GET    /api/events/[id]/orders

POST   /api/events/[id]/orders
PUT    /api/events/[id]/orders
DELETE /api/events/[id]/orders

GET    /api/events/[id]/summary
GET    /api/events/[id]/share

GET    /api/families
POST   /api/families
PUT    /api/families/[id]
DELETE /api/families/[id]

GET    /api/members
POST   /api/members
PUT    /api/members/[id]
DELETE /api/members/[id]

GET    /api/menu/categories
POST   /api/menu/categories
PUT    /api/menu/categories/[id]
DELETE /api/menu/categories/[id]

GET    /api/menu/items
POST   /api/menu/items
PUT    /api/menu/items/[id]
DELETE /api/menu/items/[id]

GET    /api/notifications
POST   /api/notifications
PUT    /api/notifications/[id]/read

GET    /api/reports/attendance
GET    /api/reports/popular-items
GET    /api/reports/active-families
```

---

## Component Library

### Layout Components
- `AppShell` - Main layout wrapper
- `BottomNav` - Mobile navigation
- `Header` - Top header with theme toggle
- `Sidebar` - Desktop sidebar

### UI Components
- `GlassCard` - Glassmorphic card
- `Button` - Primary action button
- `IconButton` - Icon-only button
- `Input` - Form input
- `Select` - Dropdown select
- `Textarea` - Multi-line input
- `Badge` - Status badge
- `Avatar` - User avatar
- `Modal` - Dialog modal
- `Toast` - Notification toast

### Feature Components
- `EventCard` - Event display card
- `AttendanceStatus` - RSVP status indicator
- `FoodItem` - Menu item with quantity
- `QuantitySelector` - +/- quantity control
- `OrderSummary` - Live summary display
- `ShareModal` - Sharing options
- `NotificationItem` - Notification list item
- `ChartCard` - Chart display wrapper

---

## File Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── [id]/rsvp/page.tsx
│   │   ├── orders/
│   │   │   └── [eventId]/page.tsx
│   │   ├── profile/page.tsx
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── families/page.tsx
│   │   ├── members/page.tsx
│   │   ├── menu/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── reports/page.tsx
│   ├── api/
│   │   └── [routes]/
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── ui/ (ShadCN)
│   ├── layout/
│   └── features/
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── validations/
├── hooks/
├── types/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── supabase/
│   └── migrations/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## Deployment Configuration

### Vercel
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### PWA Manifest
- Name: Comedy Group Planner
- Short Name: Planner
- Theme Color: #7C3AED
- Background Color: #0F172A
- Display: standalone
- Icons: 192x192, 512x512

---

## Acceptance Criteria

1. ✅ User can login with email/password
2. ✅ Admin can create families and members
3. ✅ Captain can create events with all required fields
4. ✅ Family can RSVP with Yes/No/Maybe and attendance counts
5. ✅ Family can submit food order with quantities
6. ✅ Live summary updates in real-time
7. ✅ WhatsApp shareable summary format
8. ✅ Copy to clipboard, PDF export, Print options
9. ✅ Dark/Light mode toggle
10. ✅ Mobile responsive design
11. ✅ PWA installable on mobile
12. ✅ Offline support
13. ✅ History of past events
14. ✅ Reports with charts
15. ✅ Edit orders before deadline
16. ✅ Admin can close ordering
17. ✅ QR code for events
