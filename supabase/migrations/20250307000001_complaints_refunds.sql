-- Complaints table: students raise complaints on orders
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  complaint_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REPLIED', 'RESOLVED', 'REFUNDED')),
  shopkeeper_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refunds table: track refund requests and status
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('ORDER_NOT_COMPLETED_2HR', 'COMPLAINT_NO_REPLY_2HR', 'MANUAL')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  phonepe_refund_id TEXT,
  merchant_refund_id TEXT UNIQUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add phonepe_transaction_id to orders for refunds (store txid from verify redirect)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaints
CREATE POLICY "Students can view own complaints" ON complaints FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert complaints for own orders" ON complaints FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Shop owners can view complaints for their shop" ON complaints FOR SELECT USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);
CREATE POLICY "Shop owners can update complaints (reply)" ON complaints FOR UPDATE USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

-- RLS policies for refunds
CREATE POLICY "Students can view own refunds" ON refunds FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE student_id = auth.uid())
);
CREATE POLICY "Service role can manage refunds" ON refunds FOR ALL USING (auth.role() = 'service_role');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE refunds;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_order_id ON complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_complaints_shop_id ON complaints(shop_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
