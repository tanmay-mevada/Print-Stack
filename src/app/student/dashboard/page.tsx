'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import { PDFDocument } from 'pdf-lib'
import { fetchAvailableShopsAction, submitOrderAction } from '../actions'
import { 
    Sun, Moon, Printer, LogOut, UploadCloud, FileText, 
    CheckCircle2, MapPin, Store, ArrowRight, User, History, CreditCard, Clock 
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function StudentDashboardPage() {
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const { isDark, toggleTheme } = useTheme()
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
        return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    // Filter to show ONLY active orders (not completed) in the Recent Stack
    const activeOrders = orders.filter(order => order.status !== 'COMPLETED').slice(0, 2);

    return (
        <div className={`min-h-screen font-sans transition-all duration-700 pb-32 sm:pb-20 ${
            isDark 
            ? 'bg-[#050505] text-white selection:bg-white/20' 
            : 'bg-[#f4f4f0] text-stone-900 selection:bg-stone-900/20'
        }`}>
            
            {/* ================= FLOATING MOBILE PROGRESS BAR ================= */}
            {step < 4 && (
                <div className="fixed sm:hidden bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className={`flex items-center gap-1 p-1.5 rounded-[2rem] border backdrop-blur-xl shadow-2xl ${
                        isDark ? 'bg-[#18181b]/80 border-white/10' : 'bg-white/90 border-stone-200'
                    }`}>
                        
                        {/* Step 1: Upload */}
                        <button 
                            onClick={() => setStep(1)}
                            className={`flex flex-col items-center justify-center w-[72px] py-2.5 rounded-[1.5rem] transition-all duration-200 ${
                                step === 1 
                                ? (isDark ? 'bg-white/15 text-white' : 'bg-stone-200 text-stone-900') 
                                : (isDark ? 'text-white/50 hover:text-white' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <UploadCloud className="w-5 h-5 mb-1" strokeWidth={step === 1 ? 2.5 : 2} />
                            <span className="text-[11px] font-medium">Upload</span>
                        </button>

                        {/* Step 2: Shop */}
                        <button 
                            onClick={() => { if (file) setStep(2) }}
                            className={`flex flex-col items-center justify-center w-[72px] py-2.5 rounded-[1.5rem] transition-all duration-200 ${!file && 'opacity-50'} ${
                                step === 2 
                                ? (isDark ? 'bg-white/15 text-white' : 'bg-stone-200 text-stone-900') 
                                : (isDark ? 'text-white/50 hover:text-white' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <Store className="w-5 h-5 mb-1" strokeWidth={step === 2 ? 2.5 : 2} />
                            <span className="text-[11px] font-medium">Shop</span>
                        </button>

                        {/* Step 3: Checkout */}
                        <button 
                            onClick={() => { if (file && selectedShopId) setStep(3) }}
                            className={`flex flex-col items-center justify-center w-[72px] py-2.5 rounded-[1.5rem] transition-all duration-200 ${(!file || !selectedShopId) && 'opacity-50'} ${
                                step === 3 
                                ? (isDark ? 'bg-white/15 text-white' : 'bg-stone-200 text-stone-900') 
                                : (isDark ? 'text-white/50 hover:text-white' : 'text-stone-400 hover:text-stone-600')
                            }`}
                        >
                            <CreditCard className="w-5 h-5 mb-1" strokeWidth={step === 3 ? 2.5 : 2} />
                            <span className="text-[11px] font-medium">Pay</span>
                        </button>

                    </div>
                </div>
            )}
            <div className="p-6 sm:p-8 max-w-5xl mx-auto relative">
                
                {/* ================= NAVBAR ================= */}
                <div className={`flex justify-between items-center pb-6 mb-10 relative transition-colors duration-500 border-b ${isDark ? 'border-white/10' : 'border-stone-200/60'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300 ${
                            isDark ? 'bg-gradient-to-br from-white to-gray-300 text-black' : 'bg-gradient-to-br from-stone-800 to-black text-white'
                        }`}>
                            <Printer className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">
                            <span className={`bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-stone-900 to-stone-500'}`}>
                                PrintStack++
                            </span>
                            <span className={`hidden sm:inline-block ml-2 text-sm font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                                isDark ? 'bg-white/10 text-white/60' : 'bg-stone-200/50 text-stone-500'
                            }`}>
                                Student
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <button onClick={toggleTheme} className={`p-3 rounded-full transition-all duration-300 hover:scale-105 ${
                            isDark ? 'bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50'
                        }`}>
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                                isDark ? 'bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10' : 'bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50'
                            }`}>
                                <User className="w-5 h-5" />
                            </button>

                            {isProfileOpen && (
                                <div className={`absolute right-0 mt-4 w-60 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl transition-colors duration-300 animate-in fade-in slide-in-from-top-2 ${
                                    isDark ? 'bg-[#111111]/90 border border-white/10 ring-1 ring-white/5' : 'bg-white/90 border border-stone-200/50 shadow-stone-300/50'
                                }`}>
                                    <div className={`p-2 border-b ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
                                        <Link href="/student/orders" className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold transition-all ${
                                            isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-stone-50 text-stone-700 hover:text-stone-900'
                                        }`}>
                                            <History className="w-4 h-4 opacity-70" /> Order History
                                        </Link>
                                    </div>
                                    <div className="p-2">
                                        <form action={logoutAction}>
                                            <button type="submit" className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold transition-all ${
                                                isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                                            }`}>
                                                <LogOut className="w-4 h-4 opacity-70" /> Log Out
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ================= DESKTOP PROGRESS TRACKER ================= */}
                {step < 4 && (
                    <div className="hidden sm:flex items-center gap-5 mb-12 overflow-x-auto pb-4 no-scrollbar text-sm font-bold uppercase tracking-widest">
                        <div className={`flex items-center gap-3 shrink-0 transition-colors duration-500 ${step >= 1 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-500 ${step >= 1 ? (isDark ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-stone-900 bg-stone-900 text-white shadow-md') : ''}`}>1</span> UPLOAD
                        </div>
                        <div className={`h-[2px] w-20 shrink-0 rounded-full transition-colors duration-500 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}>
                            <div className={`h-full bg-current transition-all duration-700 ease-in-out ${step >= 2 ? 'w-full' : 'w-0'} ${isDark ? 'text-white' : 'text-stone-900'}`} />
                        </div>
                        <div className={`flex items-center gap-3 shrink-0 transition-colors duration-500 ${step >= 2 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-500 ${step >= 2 ? (isDark ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-stone-900 bg-stone-900 text-white shadow-md') : (isDark ? 'border-white/30' : 'border-stone-300')}`}>2</span> SELECT SHOP
                        </div>
                        <div className={`h-[2px] w-20 shrink-0 rounded-full transition-colors duration-500 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`}>
                            <div className={`h-full bg-current transition-all duration-700 ease-in-out ${step >= 3 ? 'w-full' : 'w-0'} ${isDark ? 'text-white' : 'text-stone-900'}`} />
                        </div>
                        <div className={`flex items-center gap-3 shrink-0 transition-colors duration-500 ${step >= 3 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-500 ${step >= 3 ? (isDark ? 'border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-stone-900 bg-stone-900 text-white shadow-md') : (isDark ? 'border-white/30' : 'border-stone-300')}`}>3</span> CHECKOUT
                        </div>
                    </div>
                )}

                {/* ================= STEP 1: UPLOAD & SETTINGS ================= */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        
                        {/* File Upload Dropzone */}
                        <div className={`border rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 backdrop-blur-xl ${
                            isDark 
                            ? 'bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5' 
                            : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/40'
                        }`}>
                            <h2 className="text-2xl font-black mb-6 tracking-tight">Document Upload</h2>
                            
                            <label className={`relative overflow-hidden border-2 border-dashed rounded-[2rem] p-12 sm:p-20 flex flex-col items-center justify-center cursor-pointer group transition-all duration-500 ${
                                isDark 
                                ? 'border-white/15 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05]' 
                                : 'border-stone-300 hover:border-stone-500 bg-stone-50/50 hover:bg-stone-100'
                            }`}>
                                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                                
                                {file ? (
                                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                                            isDark ? 'bg-gradient-to-br from-white/20 to-white/5 text-white ring-1 ring-white/20' : 'bg-gradient-to-br from-stone-100 to-white text-stone-900 ring-1 ring-stone-200 shadow-stone-200'
                                        }`}>
                                            <FileText className="w-10 h-10 drop-shadow-md" />
                                        </div>
                                        <p className="font-black text-xl text-center mb-2 tracking-tight">{file.name}</p>
                                        <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-xl ${
                                            isDark ? 'bg-white/5 text-white/50 group-hover:text-white group-hover:bg-white/10 ring-1 ring-white/10' : 'bg-stone-100 text-stone-400 group-hover:text-stone-900 group-hover:bg-white ring-1 ring-stone-200'
                                        }`}>
                                            <UploadCloud className="w-10 h-10" />
                                        </div>
                                        <p className="font-black text-xl text-center mb-2 tracking-tight">Click to browse PDF</p>
                                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Max file size: 10MB</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Print Settings Cards */}
                        <div className={`border rounded-[2.5rem] p-6 sm:p-10 relative backdrop-blur-xl transition-all duration-500 ${
                            isDark 
                            ? 'bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5' 
                            : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/40'
                        }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight mb-2">Print Settings</h2>
                                    <p className={`font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-500'}`}>Configure your stack exactly how you want it.</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                
                                {/* Detail Block: Pages */}
                                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                                    isDark ? 'bg-[#0A0A0A] border-white/10 hover:border-white/20' : 'bg-stone-50 border-stone-200/60 hover:border-stone-300'
                                }`}>
                                    <label className={`block text-[10px] font-bold mb-3 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Pages Detected</label>
                                    <div className="font-black text-lg flex items-center justify-between">
                                        {file ? `${printConfig.total_pages} Pages` : '--'}
                                        {file && <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />}
                                    </div>
                                </div>
                                
                                {/* Select Block: Color */}
                                <div className={`p-5 rounded-2xl border transition-all duration-300 focus-within:ring-2 ${
                                    isDark ? 'bg-[#0A0A0A] border-white/10 hover:border-white/20 focus-within:ring-white/30' : 'bg-stone-50 border-stone-200/60 hover:border-stone-300 focus-within:ring-stone-900/20'
                                }`}>
                                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Color Mode</label>
                                    <select value={printConfig.print_type} onChange={(e) => setPrintConfig({ ...printConfig, print_type: e.target.value as 'BW' | 'COLOR' })} 
                                        className="w-full bg-transparent font-black text-lg outline-none cursor-pointer appearance-none">
                                        <option value="BW">Black & White</option>
                                        <option value="COLOR">Full Color</option>
                                    </select>
                                </div>
                                
                                {/* Select Block: Layout */}
                                <div className={`p-5 rounded-2xl border transition-all duration-300 focus-within:ring-2 ${
                                    isDark ? 'bg-[#0A0A0A] border-white/10 hover:border-white/20 focus-within:ring-white/30' : 'bg-stone-50 border-stone-200/60 hover:border-stone-300 focus-within:ring-stone-900/20'
                                }`}>
                                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Layout</label>
                                    <select value={printConfig.sided} onChange={(e) => setPrintConfig({ ...printConfig, sided: e.target.value as 'SINGLE' | 'DOUBLE' })} 
                                        className="w-full bg-transparent font-black text-lg outline-none cursor-pointer appearance-none">
                                        <option value="SINGLE">Single-Sided</option>
                                        <option value="DOUBLE">Double-Sided</option>
                                    </select>
                                </div>

                                {/* Input Block: Copies */}
                                <div className={`p-5 rounded-2xl border transition-all duration-300 focus-within:ring-2 ${
                                    isDark ? 'bg-[#0A0A0A] border-white/10 hover:border-white/20 focus-within:ring-white/30' : 'bg-stone-50 border-stone-200/60 hover:border-stone-300 focus-within:ring-stone-900/20'
                                }`}>
                                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Copies</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="100" 
                                        value={printConfig.copies} 
                                        onChange={(e) => setPrintConfig({ ...printConfig, copies: parseInt(e.target.value) || 1 })} 
                                        className="w-full bg-transparent font-black text-lg outline-none cursor-pointer"
                                    />
                                </div>

                            </div>
                        </div>

                        {/* CTA Button */}
                        <button onClick={handleNextStep} disabled={!file || locating} className={`relative w-full py-5 rounded-[2rem] font-black text-lg tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                            isDark 
                            ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:-translate-y-1' 
                            : 'bg-stone-900 text-white hover:bg-black shadow-xl shadow-stone-900/20 hover:shadow-2xl hover:shadow-stone-900/30 hover:-translate-y-1'
                        }`}>
                            <span className="relative z-10 flex items-center gap-3">
                                {locating ? 'Locating Shops...' : <>Find Print Shops <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" /></>}
                            </span>
                        </button>

                        {/* Recent Orders Widget (Active Orders Only) */}
                        {activeOrders.length > 0 && (
                            <div className="pt-12">
                                <div className="flex justify-between items-end mb-8 px-2">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-1">Active Stack</h3>
                                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                                            Orders currently processing
                                        </p>
                                    </div>
                                    <Link href="/student/orders" className={`text-xs font-bold uppercase tracking-widest border-b transition-colors ${
                                        isDark ? 'border-white/30 text-white/60 hover:text-white hover:border-white' : 'border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900'
                                    }`}>
                                        View History
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {activeOrders.map(order => (
                                        <div key={order.id} className={`p-6 rounded-[2rem] border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                                            isDark ? 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10' : 'bg-white border-stone-200 shadow-sm hover:shadow-md'
                                        }`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                                                        <Clock className="w-3 h-3" /> {formatDate(order.created_at)}
                                                    </p>
                                                    <p className="font-black text-xl tracking-tight">{order.shops?.name || 'Print Shop'}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                                                    order.status === 'READY' ? (isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700') :
                                                    (isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-stone-100 border-stone-200 text-stone-700')
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            {/* Show a prompt to check email instead of showing the OTP */}
                                            {order.status === 'READY' && (
                                                <div className={`mt-2 mb-6 p-4 rounded-xl text-center border ${
                                                    isDark ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                }`}>
                                                    <p className="text-xs font-bold uppercase tracking-widest">
                                                        Check your Email for Pickup Code
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-end pt-4 border-t border-dashed border-current border-opacity-20">
                                                <div className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                                    {order.total_pages} Pg • {order.print_type}
                                                </div>
                                                <div className="font-black text-2xl tracking-tighter">₹{order.total_price}</div>
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
                        <div className="flex justify-between items-end mb-8 px-2">
                            <h2 className="text-4xl font-black tracking-tight">Select a Shop</h2>
                            <button onClick={() => setStep(1)} className={`font-bold text-xs uppercase tracking-widest border-b hidden sm:block transition-all ${
                                isDark ? 'border-white/50 hover:border-white' : 'border-stone-400 hover:border-stone-900'
                            }`}>← Back</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {shops.map((shop) => {
                                const exactPrice = getExactShopPrice(shop);
                                const isConfigured = exactPrice !== null;
                                const isSelected = selectedShopId === shop.id;
                                
                                return (
                                    <div key={shop.id} onClick={() => isConfigured && setSelectedShopId(shop.id)} className={`relative overflow-hidden border rounded-[2rem] p-8 transition-all duration-300 ${
                                        !isConfigured 
                                        ? 'opacity-40 cursor-not-allowed grayscale' 
                                        : isSelected 
                                            ? (isDark ? 'bg-white/10 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)] ring-1 ring-white/50 -translate-y-1' : 'border-stone-900 ring-2 ring-stone-900 bg-stone-50 shadow-lg -translate-y-1') 
                                            : (isDark ? 'border-white/10 bg-[#111111]/80 hover:border-white/30 hover:bg-white/5 hover:-translate-y-1 cursor-pointer' : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-md hover:-translate-y-1 cursor-pointer')
                                    }`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="z-10">
                                                <h3 className="font-black text-2xl tracking-tight mb-2">{shop.name}</h3>
                                                <p className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                                    <MapPin className="w-4 h-4 opacity-70"/>{shop.address}
                                                </p>
                                            </div>
                                            {isConfigured && (
                                                <div className="text-right z-10">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Cost</span>
                                                    <div className="text-3xl font-black tracking-tighter">₹{exactPrice}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <button disabled={!selectedShopId} onClick={() => setStep(3)} className={`relative w-full mt-4 py-5 rounded-[2rem] font-black text-lg tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                            isDark 
                            ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1' 
                            : 'bg-stone-900 text-white hover:bg-black shadow-xl hover:shadow-2xl hover:-translate-y-1'
                        }`}>
                            <span className="relative z-10 flex items-center gap-3">
                                Proceed to Checkout <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                            </span>
                        </button>
                    </div>
                )}

                {/* ================= STEP 3: CHECKOUT ================= */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 max-w-2xl mx-auto">
                        <div className="flex justify-between items-end mb-8 px-2">
                            <h2 className="text-4xl font-black tracking-tight">Final Review</h2>
                            <button onClick={() => setStep(2)} className={`font-bold text-xs uppercase tracking-widest border-b hidden sm:block transition-all ${
                                isDark ? 'border-white/50 hover:border-white' : 'border-stone-400 hover:border-stone-900'
                            }`}>← Back</button>
                        </div>
                        
                        <div className={`border rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-xl transition-all duration-500 ${
                            isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5' : 'bg-white border-stone-200/60 shadow-xl shadow-stone-200/40'
                        }`}>
                            
                            {/* Receipt Details */}
                            <div className="space-y-6 border-b border-dashed border-current border-opacity-20 pb-8 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Destination</span>
                                    <span className="font-black text-lg">{shops.find(s => s.id === selectedShopId)?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Document</span>
                                    <span className="font-bold text-sm max-w-[50%] truncate">{file?.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Specs</span>
                                    <span className="font-bold text-sm">{printConfig.print_type} • {printConfig.sided} • {printConfig.total_pages} Pg × {printConfig.copies}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Total Due</p>
                                    <p className="text-5xl font-black tracking-tighter">₹{getExactShopPrice(shops.find(s => s.id === selectedShopId))}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-stone-100'}`}>
                                    <CreditCard className={`w-5 h-5 ${isDark ? 'text-white' : 'text-stone-900'}`} />
                                </div>
                            </div>
                        </div>

                        <button onClick={handleCheckout} disabled={uploading} className={`relative w-full py-6 rounded-[2rem] font-black text-xl tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                            isDark 
                            ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1' 
                            : 'bg-stone-900 text-white hover:bg-black shadow-xl hover:shadow-2xl hover:-translate-y-1'
                        }`}>
                            <span className="relative z-10 flex items-center gap-3">
                                {uploading ? (
                                    <>
                                        <svg className={`animate-spin h-6 w-6 ${isDark ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                    </>
                                ) : 'Confirm & Pay'}
                            </span>
                        </button>
                    </div>
                )}

                {/* ================= STEP 4: SUCCESS ================= */}
                {step === 4 && (
                    <div className="animate-in zoom-in-95 duration-700 max-w-lg mx-auto mt-12">
                        <div className={`border rounded-[3rem] p-12 sm:p-16 text-center backdrop-blur-xl ${
                            isDark 
                            ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] ring-1 ring-white/5' 
                            : 'bg-white border-stone-200 shadow-2xl shadow-stone-200/50'
                        }`}>
                            <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${
                                isDark ? 'bg-gradient-to-br from-green-400 to-green-600 text-black' : 'bg-gradient-to-br from-green-500 to-green-700 text-white'
                            }`}>
                                <CheckCircle2 className="w-14 h-14 drop-shadow-md" />
                            </div>
                            
                            <h2 className="text-4xl font-black mb-4 tracking-tight">Success!</h2>
                            <p className={`font-medium text-lg leading-relaxed mb-12 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                Your document is securely on its way to the print shop. 
                            </p>
                            
                            <button onClick={() => window.location.reload()} className={`w-full py-5 rounded-[2rem] font-black tracking-widest uppercase transition-all duration-300 border ${
                                isDark ? 'border-white/20 hover:bg-white/10 text-white hover:border-white/40' : 'border-stone-300 hover:bg-stone-50 text-stone-900 hover:border-stone-400'
                            }`}>
                                Print Another Document
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}