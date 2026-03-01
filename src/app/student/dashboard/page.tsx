'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import { PDFDocument } from 'pdf-lib'
import { fetchAvailableShopsAction, submitOrderAction } from '../actions'
import { 
    Sun, Moon, Printer, LogOut, UploadCloud, FileText, 
    CheckCircle2, MapPin, Store, ArrowRight, User, History, CreditCard 
} from 'lucide-react'

export default function StudentDashboardPage() {
    const [isDark, setIsDark] = useState(true)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    
    const [step, setStep] = useState(1)
    const [file, setFile] = useState<File | null>(null)
    const [orders, setOrders] = useState<any[]>([])
    
    const [printConfig, setPrintConfig] = useState<{
        print_type: 'BW' | 'COLOR';
        sided: 'SINGLE' | 'DOUBLE';
        copies: number;
        total_pages: number;
    }>({
        print_type: 'BW', sided: 'SINGLE', copies: 1, total_pages: 1,
    })

    const [locating, setLocating] = useState(false)
    const [shops, setShops] = useState<any[]>([])
    const [searchType, setSearchType] = useState<'nearby' | 'all'>('all')
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        async function fetchUserOrders() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data } = await supabase
                    .from('orders')
                    .select('*, shops(name)') 
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false })
                if (data) setOrders(data)
            }
        }
        fetchUserOrders()
    }, [])

    const approxPrice = (() => {
        if (!file) return "0.00"; 
        const base = printConfig.print_type === 'COLOR' ? 10 : 2; 
        const modifier = printConfig.sided === 'DOUBLE' ? 0.8 : 1; 
        return ((base * modifier) * printConfig.total_pages * printConfig.copies).toFixed(2);
    })();

    function getExactShopPrice(shop: any) {
        if (!shop?.pricing) return null;
        const base = printConfig.print_type === 'COLOR' ? shop.pricing.color_price : shop.pricing.bw_price;
        const modifier = printConfig.sided === 'DOUBLE' ? shop.pricing.double_side_modifier : 1;
        return ((base * modifier) * printConfig.total_pages * printConfig.copies).toFixed(2);
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0]
            if (selected.type !== 'application/pdf') return alert("Please upload a PDF file.")
            
            setFile(selected)
            try {
                const arrayBuffer = await selected.arrayBuffer()
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
                setPrintConfig(prev => ({ ...prev, total_pages: pdfDoc.getPageCount() }))
            } catch (error) {
                alert("We couldn't read the page count of this PDF.")
            }
        }
    }

    async function loadShops(lat?: number, lng?: number) {
        const res = await fetchAvailableShopsAction(lat, lng)
        if (res.shops) {
            setShops(res.shops)
            setSearchType(res.type as 'nearby' | 'all')
        }
        setLocating(false)
        setStep(2)
    }

    function handleNextStep() {
        if (!file) return alert("Please upload a file first!")
        setLocating(true)
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => loadShops(pos.coords.latitude, pos.coords.longitude),
                () => loadShops(), { timeout: 5000 }
            )
        } else {
            loadShops()
        }
    }

    async function handleCheckout() {
        if (!file || !selectedShopId) return
        setUploading(true)

        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_')
        const storagePath = `uploads/${Date.now()}-${safeFileName}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from('print_files').upload(storagePath, file)
        if (uploadError) {
            alert("Upload failed: " + uploadError.message)
            setUploading(false)
            return
        }

        const res = await submitOrderAction({
            shopId: selectedShopId, filePath: storagePath, config: printConfig 
        })

        if (res.success && res.paymentUrl) {
            window.location.href = res.paymentUrl
        } else {
            setStep(4)
        }
        setUploading(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 pb-32 sm:pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
            
            {/* ================= FLOATING MOBILE PROGRESS BAR (SLIDING EFFECT) ================= */}
            {step < 4 && (
                <div className={`fixed sm:hidden bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center p-1.5 rounded-full border backdrop-blur-xl shadow-2xl transition-colors duration-500 w-[92%] max-w-sm ${
                    isDark ? 'bg-[#111111]/80 border-white/10 shadow-black/80' : 'bg-white/90 border-stone-200 shadow-stone-300/50'
                }`}>
                    <div className="relative flex w-full">
                        
                        {/* Animated Background Pill */}
                        <div 
                            className={`absolute top-0 bottom-0 left-0 w-1/3 rounded-full transition-transform duration-300 ease-out ${
                                isDark ? 'bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-stone-100 shadow-sm border border-stone-200'
                            }`}
                            style={{ transform: `translateX(${(step - 1) * 100}%)` }}
                        />

                        {/* Step 1: Upload */}
                        <button 
                            onClick={() => setStep(1)}
                            className={`relative z-10 flex flex-col items-center justify-center flex-1 py-3 transition-colors duration-300 ${
                                step === 1 
                                ? (isDark ? 'text-white' : 'text-stone-900') 
                                : (isDark ? 'text-white/40 hover:text-white/60' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <UploadCloud className={`w-5 h-5 mb-1 transition-transform ${step === 1 ? 'scale-110' : 'scale-100'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Upload</span>
                        </button>

                        {/* Step 2: Shop */}
                        <button 
                            onClick={() => { if (file) setStep(2) }}
                            className={`relative z-10 flex flex-col items-center justify-center flex-1 py-3 transition-colors duration-300 ${!file && 'cursor-not-allowed'} ${
                                step === 2 
                                ? (isDark ? 'text-white' : 'text-stone-900') 
                                : (isDark ? 'text-white/40 hover:text-white/60' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <Store className={`w-5 h-5 mb-1 transition-transform ${step === 2 ? 'scale-110' : 'scale-100'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Shop</span>
                        </button>

                        {/* Step 3: Checkout */}
                        <button 
                            onClick={() => { if (file && selectedShopId) setStep(3) }}
                            className={`relative z-10 flex flex-col items-center justify-center flex-1 py-3 transition-colors duration-300 ${(!file || !selectedShopId) && 'cursor-not-allowed'} ${
                                step === 3 
                                ? (isDark ? 'text-white' : 'text-stone-900') 
                                : (isDark ? 'text-white/40 hover:text-white/60' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <CreditCard className={`w-5 h-5 mb-1 transition-transform ${step === 3 ? 'scale-110' : 'scale-100'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Pay</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="p-6 sm:p-8 max-w-5xl mx-auto relative">
                
                {/* ================= NAVBAR ================= */}
                <div className={`flex justify-between items-center border-b pb-6 mb-10 relative transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300 ${isDark ? 'bg-white' : 'bg-stone-900'}`}>
                            <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
                        </div>
                        <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            PrintStack++ <span className={isDark ? 'text-white/40' : 'text-stone-400 hidden sm:inline'}>Student</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-full transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}>
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${isDark ? 'border-white/20 bg-[#111111] hover:bg-white/10 text-white' : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'}`}>
                                <User className="w-5 h-5" />
                            </button>

                            {isProfileOpen && (
                                <div className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-xl z-50 overflow-hidden border transition-colors ${isDark ? 'bg-[#111111] border-white/10 shadow-black' : 'bg-white border-stone-200 shadow-stone-200/50'}`}>
                                    <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                                        <Link href="/student/orders" className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'}`}>
                                            <History className="w-4 h-4" /> Order History
                                        </Link>
                                    </div>
                                    <div className="p-2">
                                        <form action={logoutAction}>
                                            <button type="submit" className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}>
                                                <LogOut className="w-4 h-4" /> Log Out
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ================= DESKTOP PROGRESS TRACKER (HIDDEN ON MOBILE) ================= */}
                {step < 4 && (
                    <div className="hidden sm:flex items-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar text-sm font-bold uppercase tracking-widest">
                        <div className={`flex items-center gap-2 shrink-0 ${step >= 1 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${step >= 1 ? (isDark ? 'border-white bg-white text-black' : 'border-stone-900 bg-stone-900 text-white') : ''}`}>1</span> UPLOAD
                        </div>
                        <div className={`h-px w-16 shrink-0 ${isDark ? 'bg-white/20' : 'bg-stone-300'}`}></div>
                        <div className={`flex items-center gap-2 shrink-0 ${step >= 2 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${step >= 2 ? (isDark ? 'border-white bg-white text-black' : 'border-stone-900 bg-stone-900 text-white') : (isDark ? 'border-white/30' : 'border-stone-400')}`}>2</span> SELECT SHOP
                        </div>
                        <div className={`h-px w-16 shrink-0 ${isDark ? 'bg-white/20' : 'bg-stone-300'}`}></div>
                        <div className={`flex items-center gap-2 shrink-0 ${step >= 3 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${step >= 3 ? (isDark ? 'border-white bg-white text-black' : 'border-stone-900 bg-stone-900 text-white') : (isDark ? 'border-white/30' : 'border-stone-400')}`}>3</span> CHECKOUT
                        </div>
                    </div>
                )}

                {/* ================= STEP 1: UPLOAD & SETTINGS ================= */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`border rounded-[2rem] p-6 sm:p-10 transition-colors ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                            <h2 className="text-xl font-black mb-6">Document Upload</h2>
                            <label className={`border-2 border-dashed rounded-2xl p-10 sm:p-16 flex flex-col items-center justify-center cursor-pointer group ${isDark ? 'border-white/20 hover:border-white/50 hover:bg-white/5' : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50'}`}>
                                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                                {file ? (
                                    <>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900'}`}><FileText className="w-8 h-8" /></div>
                                        <p className="font-bold text-lg text-center">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:-translate-y-2 transition-transform ${isDark ? 'bg-white/5 text-white/60' : 'bg-stone-100 text-stone-400'}`}><UploadCloud className="w-8 h-8" /></div>
                                        <p className="font-bold text-lg text-center">Click to browse PDF</p>
                                    </>
                                )}
                            </label>
                        </div>

                        <div className={`border rounded-[2rem] p-6 sm:p-10 relative ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-8 gap-4">
                                <h2 className="text-xl font-black">Print Settings</h2>
                                <div className="text-right">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Est. Cost</span>
                                    <span className="block text-2xl font-black">₹{approxPrice}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Pages Detected</label>
                                    <div className={`p-4 rounded-xl border font-bold flex justify-between ${isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-100 border-stone-200 text-stone-500'}`}>
                                        {file ? `${printConfig.total_pages} Pages` : '--'}
                                        {file && <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Color Mode</label>
                                    <select value={printConfig.print_type} onChange={(e) => setPrintConfig({ ...printConfig, print_type: e.target.value as 'BW' | 'COLOR' })} className={`w-full p-4 rounded-xl border font-bold outline-none cursor-pointer ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
                                        <option value="BW">Black & White</option>
                                        <option value="COLOR">Full Color</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Layout</label>
                                    <select value={printConfig.sided} onChange={(e) => setPrintConfig({ ...printConfig, sided: e.target.value as 'SINGLE' | 'DOUBLE' })} className={`w-full p-4 rounded-xl border font-bold outline-none cursor-pointer ${isDark ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
                                        <option value="SINGLE">Single-Sided</option>
                                        <option value="DOUBLE">Double-Sided</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleNextStep} disabled={!file || locating} className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xl'}`}>
                            {locating ? 'Locating Shops...' : <>Find Shops <ArrowRight className="w-6 h-6" /></>}
                        </button>

                        {orders.length > 0 && (
                            <div className="pt-10">
                                <div className="flex justify-between items-end mb-6">
                                    <h3 className="text-xl font-black">Recent Orders</h3>
                                    <Link href="/student/orders" className={`text-sm font-bold border-b transition-colors ${isDark ? 'border-white/50 text-white/50 hover:text-white hover:border-white' : 'border-stone-400 text-stone-500 hover:text-stone-900 hover:border-stone-900'}`}>
                                        View Full History
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {orders.slice(0, 2).map(order => (
                                        <div key={order.id} className={`p-5 rounded-[1.5rem] border flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>{formatDate(order.created_at)}</p>
                                                    <p className="font-bold text-lg">{order.shops?.name || 'Print Shop'}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>{order.total_pages} Pages • {order.print_type}</div>
                                                <div className="font-black text-lg">₹{order.total_price}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= STEP 2: SHOP SELECTION ================= */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex justify-between items-end mb-8">
                            <h2 className="text-3xl font-black tracking-tight">Select a Shop</h2>
                            <button onClick={() => setStep(1)} className={`font-bold text-sm border-b hidden sm:block ${isDark ? 'border-white' : 'border-stone-900'}`}>← Back</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shops.map((shop) => {
                                const exactPrice = getExactShopPrice(shop);
                                const isConfigured = exactPrice !== null;
                                const isSelected = selectedShopId === shop.id;
                                return (
                                    <div key={shop.id} onClick={() => isConfigured && setSelectedShopId(shop.id)} className={`border rounded-[1.5rem] p-6 transition-all cursor-pointer ${!isConfigured ? 'opacity-40' : isSelected ? (isDark ? 'bg-white/10 border-white' : 'border-stone-900 ring-1 ring-stone-900 bg-stone-50') : (isDark ? 'border-white/10 bg-[#111111]' : 'border-stone-200 bg-white')}`}>
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="font-bold text-xl">{shop.name}</h3>
                                                <p className={`text-sm mt-1 flex items-center gap-1 ${isDark ? 'text-white/60' : 'text-stone-500'}`}><MapPin className="w-4 h-4"/>{shop.address}</p>
                                            </div>
                                            {isConfigured && <div className="text-right text-2xl font-black">₹{exactPrice}</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <button disabled={!selectedShopId} onClick={() => setStep(3)} className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'}`}>
                            Proceed to Checkout <ArrowRight className="w-6 h-6 inline ml-2" />
                        </button>
                    </div>
                )}

                {/* ================= STEP 3: CHECKOUT ================= */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-3xl font-black">Final Review</h2>
                            <button onClick={() => setStep(2)} className={`font-bold text-sm border-b hidden sm:block ${isDark ? 'border-white' : 'border-stone-900'}`}>← Back</button>
                        </div>
                        <div className={`border rounded-[2rem] p-8 sm:p-12 ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200'}`}>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Total Due</p>
                                    <p className="text-4xl font-black">₹{getExactShopPrice(shops.find(s => s.id === selectedShopId))}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleCheckout} disabled={uploading} className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase disabled:opacity-50 ${isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'}`}>
                            {uploading ? 'Processing...' : 'Confirm & Pay'}
                        </button>
                    </div>
                )}

                {/* ================= STEP 4: SUCCESS ================= */}
                {step === 4 && (
                    <div className="animate-in zoom-in-95 duration-500 max-w-lg mx-auto mt-12">
                        <div className={`border rounded-[2.5rem] p-12 text-center ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-2xl'}`}>
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-6" />
                            <h2 className="text-3xl font-black mb-4">Order Submitted!</h2>
                            <button onClick={() => window.location.reload()} className={`w-full py-4 rounded-xl font-bold uppercase border ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-stone-300 hover:bg-stone-50'}`}>
                                Print Another Document
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}