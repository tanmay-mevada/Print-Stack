'use server'

import { createClient } from '@supabase/supabase-js'

// Use Service Role Key for God-Mode access (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getAdminMasterData() {
  try {
    // Fetch EVERYTHING in parallel for the SPA
    const [
      { data: profiles },
      { data: shops },
      { data: orders },
      { data: refunds },
      { data: complaints }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('shops').select('*, profiles(name, email)').order('created_at', { ascending: false }),
      supabaseAdmin.from('orders').select('*, shops(name), profiles:student_id(name)').order('created_at', { ascending: false }),
      supabaseAdmin.from('refunds').select('*, shops(name), profiles:student_id(name)').order('created_at', { ascending: false }),
      supabaseAdmin.from('complaints').select('*, shops(name), profiles:student_id(name)').order('created_at', { ascending: false })
    ]);

    // Calculate Metrics
    const completedOrders = orders?.filter(o => o.status === 'COMPLETED') || [];
    const activeOrders = orders?.filter(o => ['PAID', 'PRINTING', 'READY'].includes(o.status)) || [];
    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
    const pendingRefunds = refunds?.filter(r => r.status === 'REQUESTED')?.length || 0;
    const openComplaints = complaints?.filter(c => c.status === 'OPEN')?.length || 0;

    return {
      success: true,
      metrics: {
        usersCount: profiles?.length || 0,
        shopsCount: shops?.length || 0,
        activeOrdersCount: activeOrders.length,
        totalRevenue,
        pendingRefunds,
        openComplaints
      },
      lists: {
        profiles: profiles || [],
        shops: shops || [],
        orders: orders || [],
        refunds: refunds || [],
        complaints: complaints || []
      }
    }
  } catch (error: any) {
    console.error("Admin fetch error:", error);
    return { error: error.message };
  }
}