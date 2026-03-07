-- ============================================================================
-- PrintStack Database Schema
-- Complete schema for the PrintStack application including all tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Stores user profile information for both students and shop owners
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  phone TEXT,
  profile_pic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SHOPS TABLE
-- Stores print shop information and settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ============================================================================
-- PRICING CONFIGS TABLE
-- Stores pricing and inventory information for each shop
-- ============================================================================
CREATE TABLE IF NOT EXISTS pricing_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE UNIQUE,

  -- Basic pricing
  bw_price DECIMAL(10,2),
  color_price DECIMAL(10,2),
  double_side_modifier DECIMAL(3,2) DEFAULT 1.0,

  -- Paper size pricing (optional)
  a3_price DECIMAL(10,2),
  a3_stock INTEGER DEFAULT 0,
  a2_price DECIMAL(10,2),
  a2_stock INTEGER DEFAULT 0,
  a1_price DECIMAL(10,2),
  a1_stock INTEGER DEFAULT 0,
  a0_price DECIMAL(10,2),
  a0_stock INTEGER DEFAULT 0,

  -- Finishing options
  spiral_binding_price DECIMAL(10,2),
  hard_binding_price DECIMAL(10,2),
  stapling_price DECIMAL(10,2),
  transparent_cover_price DECIMAL(10,2),
  lamination_price DECIMAL(10,2),
  paper_file_price DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDERS TABLE
-- Stores print order information
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

  -- File information
  file_path TEXT NOT NULL,

  -- Print specifications
  total_pages INTEGER NOT NULL,
  print_type VARCHAR(10) NOT NULL CHECK (print_type IN ('BW', 'COLOR', 'MIXED')),
  sided VARCHAR(10) NOT NULL CHECK (sided IN ('SINGLE', 'DOUBLE', 'MIXED')),
  copies INTEGER NOT NULL DEFAULT 1,
  color_pages TEXT, -- JSON string of page ranges
  double_pages TEXT, -- JSON string of page ranges
  paper_size VARCHAR(5) NOT NULL DEFAULT 'A4' CHECK (paper_size IN ('A4', 'A3', 'A2', 'A1', 'A0')),

  -- Finishing options
  binding_type VARCHAR(10) CHECK (binding_type IN ('SPIRAL', 'HARD')),
  wants_stapling BOOLEAN DEFAULT false,
  wants_cover BOOLEAN DEFAULT false,
  wants_lamination BOOLEAN DEFAULT false,
  wants_paper_file BOOLEAN DEFAULT false,

  -- Pricing and status
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PAID', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED')),

  -- OTP for pickup verification
  otp_hash TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Stores in-app notifications for users
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REFUNDS TABLE
-- Stores refund requests from students
-- ============================================================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- ============================================================================
-- COMPLAINTS TABLE
-- Stores complaints raised by students
-- ============================================================================
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Shops indexes
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(latitude, longitude);

-- Pricing configs indexes
CREATE INDEX IF NOT EXISTS idx_pricing_configs_shop_id ON pricing_configs(shop_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Refunds indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_student_id ON refunds(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_shop_id ON refunds(shop_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Complaints indexes
CREATE INDEX IF NOT EXISTS idx_complaints_order_id ON complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_shop_id ON complaints(shop_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Shops policies
CREATE POLICY "Anyone can view active shops" ON shops
  FOR SELECT USING (is_active = true OR auth.uid() = owner_id);

CREATE POLICY "Shop owners can update their shops" ON shops
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can create shops" ON shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Pricing configs policies
CREATE POLICY "Anyone can view pricing configs" ON pricing_configs
  FOR SELECT USING (true);

CREATE POLICY "Shop owners can update their pricing" ON pricing_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = pricing_configs.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Students can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Shop owners can view orders for their shop" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = orders.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Students can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Shop owners can update orders for their shop" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = orders.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Refunds policies
CREATE POLICY "Students can view their own refunds" ON refunds
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Shops can view refunds for their orders" ON refunds
  FOR SELECT USING (auth.uid() = shop_id);

CREATE POLICY "Students can create refund requests" ON refunds
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Shops can update refunds for their orders" ON refunds
  FOR UPDATE USING (auth.uid() = shop_id);

-- Complaints policies
CREATE POLICY "Students can view their own complaints" ON complaints
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Shops can view complaints for their orders" ON complaints
  FOR SELECT USING (auth.uid() = shop_id);

CREATE POLICY "Students can create complaints" ON complaints
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Shops can update complaints for their orders" ON complaints
  FOR UPDATE USING (auth.uid() = shop_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_configs_updated_at BEFORE UPDATE ON pricing_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();