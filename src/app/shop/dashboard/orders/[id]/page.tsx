import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getDownloadUrlAction } from '@/app/shop/actions'

export default async function OrderDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = await Promise.resolve(params);
  const orderId = resolvedParams.id;
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, profiles:student_id(name, email)')
    .eq('id', orderId)
    .single()

  if (error || !order) return <div className="p-12 text-center text-red-600 font-bold uppercase">Order not found.</div>

  // Generate secure download link for this specific page
  const downloadLink = await getDownloadUrlAction(order.file_path)

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/shop/dashboard" className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-8 inline-block hover:text-gray-500">
          ← Back to Dashboard
        </Link>

        <div className="bg-white border border-stone-300 shadow-sm p-8">
          <div className="border-b border-stone-200 pb-6 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider mb-2">Order Details</h1>
              <p className="font-mono text-sm text-gray-500">ID: {order.id}</p>
            </div>
            <div className="text-right">
              <span className="bg-stone-100 text-stone-800 border border-stone-300 px-4 py-2 text-xs font-bold uppercase tracking-widest">
                Status: {order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Student Info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Student Information</h3>
              <p className="font-bold text-lg">{order.profiles?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{order.profiles?.email}</p>
              <p className="text-sm text-gray-500 mt-2">Ordered on: {new Date(order.created_at).toLocaleString()}</p>
            </div>

            {/* Print Config */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Print Configuration</h3>
              <ul className="space-y-2 text-sm font-medium">
                <li><span className="text-gray-500 w-24 inline-block">Color Mode:</span> {order.print_type}</li>
                <li><span className="text-gray-500 w-24 inline-block">Print Sides:</span> {order.sided}</li>
                <li><span className="text-gray-500 w-24 inline-block">Total Pages:</span> {order.total_pages}</li>
                <li><span className="text-gray-500 w-24 inline-block">Copies:</span> x{order.copies}</li>
              </ul>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-6 flex justify-between items-center mb-8">
             <div>
               <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total Paid</h3>
               <p className="text-3xl font-black">₹{order.total_price}</p>
             </div>
             <div>
                {downloadLink.url ? (
                  <a href={downloadLink.url} target="_blank" rel="noopener noreferrer" className="bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors inline-block">
                    Download PDF Document
                  </a>
                ) : (
                  <span className="text-red-500 font-bold text-sm">File Unavailable</span>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}