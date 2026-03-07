# PrintStack Database Setup

This document explains how to set up the complete database schema for the PrintStack application.

## 📋 Database Tables Overview

The PrintStack application uses the following tables:

### Core Tables
- **`profiles`** - User profile information (students and shop owners)
- **`shops`** - Print shop information and settings
- **`pricing_configs`** - Pricing and inventory for each shop
- **`orders`** - Print order information and status
- **`notifications`** - In-app notifications for users

### New Feature Tables (Refunds & Complaints)
- **`refunds`** - Refund requests from students
- **`complaints`** - Complaint submissions from students

## 🚀 Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to the SQL Editor**
3. **Copy and paste the contents of `supabase/complete_schema.sql`**
4. **Run the SQL script**

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 3: Manual Migration

1. **Copy the SQL from `supabase/migrations/20240307_add_refunds_complaints.sql`**
2. **Run it in your Supabase SQL Editor**

## 📊 Table Schemas

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  phone TEXT,
  profile_pic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Shops Table
```sql
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  map_link TEXT,
  is_active BOOLEAN DEFAULT true,
  paused_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  shop_id UUID REFERENCES shops(id),
  file_path TEXT NOT NULL,
  total_pages INTEGER NOT NULL,
  print_type VARCHAR(10) NOT NULL, -- 'BW', 'COLOR', 'MIXED'
  sided VARCHAR(10) NOT NULL, -- 'SINGLE', 'DOUBLE', 'MIXED'
  copies INTEGER NOT NULL DEFAULT 1,
  color_pages TEXT,
  double_pages TEXT,
  paper_size VARCHAR(5) NOT NULL DEFAULT 'A4',
  binding_type VARCHAR(10), -- 'SPIRAL', 'HARD'
  wants_stapling BOOLEAN DEFAULT false,
  wants_cover BOOLEAN DEFAULT false,
  wants_lamination BOOLEAN DEFAULT false,
  wants_paper_file BOOLEAN DEFAULT false,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
  otp_hash TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Refunds Table
```sql
CREATE TABLE refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  student_id UUID REFERENCES profiles(id),
  shop_id UUID REFERENCES shops(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);
```

### Complaints Table
```sql
CREATE TABLE complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  student_id UUID REFERENCES profiles(id),
  shop_id UUID REFERENCES shops(id),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);
```

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- **Students** can only see their own data
- **Shop owners** can see data related to their shops
- **Public access** for shop listings and pricing

### Authentication
The application uses Supabase Auth with:
- Email/password authentication
- JWT tokens for API access
- Automatic user profile creation

## 📈 Performance Optimizations

### Indexes
- Primary key indexes on all tables
- Foreign key indexes for relationships
- Status and date indexes for common queries
- Location indexes for shop proximity searches

### Triggers
- Automatic `updated_at` timestamp updates
- UUID generation for primary keys

## 🔄 Real-time Features

The application uses Supabase real-time subscriptions for:
- Live order status updates
- Real-time notifications
- Instant refund/complaint status changes

## 🧪 Testing the Setup

After running the migration:

1. **Check table creation** in Supabase dashboard
2. **Verify RLS policies** are active
3. **Test basic CRUD operations** through the app
4. **Verify real-time subscriptions** work

## 📝 Notes

- All tables use UUID primary keys for scalability
- Foreign key constraints ensure data integrity
- The schema supports the complete PrintStack workflow from order placement to delivery
- Real-time features require Supabase real-time to be enabled (default)

## 🆘 Troubleshooting

**Migration fails?**
- Check if tables already exist
- Verify Supabase project permissions
- Ensure UUID extension is available

**RLS blocking queries?**
- Check user authentication
- Verify policy conditions
- Test with service role key if needed

**Real-time not working?**
- Enable real-time in Supabase dashboard
- Check subscription syntax
- Verify table has real-time enabled