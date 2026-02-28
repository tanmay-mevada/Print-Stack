'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fetchAvailableShopsAction, submitOrderAction } from '../actions'
import { logoutAction } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import { PDFDocument } from 'pdf-lib'
import { Sun, Moon, Printer, LogOut, UploadCloud, FileText, CheckCircle2, MapPin, Store,ArrowRight } from 'lucide-react'

export default function StudentDashboardPage() {
    // --- UI/THEME STATE ---
    const [isDark, setIsDark] = useState(true)
    
    // --- APP STATE ---
    const [step, setStep] = useState(1)
    const [file, setFile] = useState<File | null>(null)
    
    const [printConfig, setPrintConfig] = useState<{
        print_type: 'BW' | 'COLOR';
        sided: 'SINGLE' | 'DOUBLE';
        copies: number;
        total_pages: number;
    }>({
        print_type: 'BW',
        sided: 'SINGLE',
        copies: 1,
        total_pages: 1,
    })

    const [locating, setLocating] = useState(false)
    const [shops, setShops] = useState<any[]>([])
    const [searchType, setSearchType] = useState<'nearby' | 'all'>('all')
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    // --- MATH HELPERS ---
    function getExactShopPrice(shop: any) {
        if (!shop?.pricing) return null;
        const base = printConfig.print_type === 'COLOR' ? shop.pricing.color_price : shop.pricing.bw_price;
        const modifier = printConfig.sided === 'DOUBLE' ? shop.pricing.double_side_modifier : 1;
        return ((base * modifier) * printConfig.total_pages * printConfig.copies).toFixed(2);
    }

    // --- HANDLERS ---
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0]
            if (selected.type !== 'application/pdf') {
                alert("Please upload a PDF file.")
                return
            }
            
            setFile(selected)

            try {
                const arrayBuffer = await selected.arrayBuffer()
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
                const pageCount = pdfDoc.getPageCount()
                setPrintConfig(prev => ({ ...prev, total_pages: pageCount }))
            } catch (error) {
                console.error("Failed to parse PDF:", error)
                alert("We couldn't read the page count of this PDF. It might be corrupted or heavily encrypted.")
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
                (position) => loadShops(position.coords.latitude, position.coords.longitude),
                (error) => loadShops(),
                { timeout: 5000 }
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
        const uniqueFileName = `${Date.now()}-${safeFileName}.${fileExt}`
        const storagePath = `uploads/${uniqueFileName}`

        const { error: uploadError } = await supabase.storage
            .from('print_files')
            .upload(storagePath, file)

        if (uploadError) {
            alert("Upload failed: " + uploadError.message)
            setUploading(false)
            return
        }

        const res = await submitOrderAction({
            shopId: selectedShopId,
            filePath: storagePath,
            config: printConfig 
        })

        if (res.success) {
            setStep(4) 
        } else {
            alert("Failed to submit order: " + res.error)
        }
        setUploading(false)
    }

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 pb-20 ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#faf9f6] text-stone-900'}`}>
            <div className="p-6 sm:p-8 max-w-5xl mx-auto">
                
                {/* ================= NAVBAR ================= */}
                <div className={`flex justify-between items-center border-b pb-6 mb-10 relative transition-colors duration-500 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300 ${isDark ? 'bg-white' : 'bg-stone-900'}`}>
                            <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
                        </div>
                        <h1 className={`text-2xl font-black tracking-tight transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            PrintStack++ <span className={isDark ? 'text-white/40' : 'text-stone-400'}>Student</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            type="button"
                            onClick={() => setIsDark(!isDark)}
                            className={`p-2.5 rounded-full transition-all duration-300 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <form action={logoutAction}>
                            <button 
                                type="submit"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                                    isDark 
                                    ? 'border-white/20 bg-transparent hover:bg-white/10 text-white' 
                                    : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-900 shadow-sm'
                                }`}
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Log Out</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* ================= PROGRESS TRACKER ================= */}
                {step < 4 && (
                    <div className="flex items-center gap-2 sm:gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar text-xs sm:text-sm font-bold uppercase tracking-widest">
                        <div className={`flex items-center gap-2 shrink-0 ${step >= 1 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${step >= 1 ? (isDark ? 'border-white bg-white text-black' : 'border-stone-900 bg-stone-900 text-white') : ''}`}>1</span>
                            UPLOAD
                        </div>
                        <div className={`h-px w-8 sm:w-16 shrink-0 ${isDark ? 'bg-white/20' : 'bg-stone-300'}`}></div>
                        <div className={`flex items-center gap-2 shrink-0 ${step >= 2 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${step >= 2 ? (isDark ? 'border-white bg-white text-black' : 'border-stone-900 bg-stone-900 text-white') : (isDark ? 'border-white/30' : 'border-stone-400')}`}>2</span>
                            SELECT SHOP
                        </div>
                        <div className={`h-px w-8 sm:w-16 shrink-0 ${isDark ? 'bg-white/20' : 'bg-stone-300'}`}></div>
                        <div className={`flex items-center gap-2 shrink-0 ${step >= 3 ? (isDark ? 'text-white' : 'text-stone-900') : (isDark ? 'text-white/30' : 'text-stone-400')}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${step >= 3 ? (isDark ? 'border-white bg-white text-black' : 'border-stone-900 bg-stone-900 text-white') : (isDark ? 'border-white/30' : 'border-stone-400')}`}>3</span>
                            CHECKOUT
                        </div>
                    </div>
                )}

                {/* ================= STEP 1: UPLOAD & SETTINGS ================= */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* File Upload Box */}
                        <div className={`border rounded-[2rem] p-6 sm:p-10 transition-colors duration-500 ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black mb-1">Document Upload</h2>
                                    <p className={`font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-500'}`}>Upload your PDF to get started.</p>
                                </div>
                            </div>
                            
                            <label className={`border-2 border-dashed rounded-2xl p-10 sm:p-16 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                                isDark 
                                ? 'border-white/20 hover:border-white/50 hover:bg-white/5' 
                                : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                            }`}>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {file ? (
                                    <>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900'}`}>
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-lg text-center">{file.name}</p>
                                        <p className={`text-sm mt-2 font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                                    </>
                                ) : (
                                    <>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-2 ${isDark ? 'bg-white/5 text-white/60' : 'bg-stone-100 text-stone-400'}`}>
                                            <UploadCloud className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-lg text-center">Click to browse or drag PDF here</p>
                                        <p className={`text-sm mt-2 font-medium ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Max file size: 10MB</p>
                                    </>
                                )}
                            </label>
                        </div>

                        {/* Print Settings Box */}
                        <div className={`border rounded-[2rem] p-6 sm:p-10 transition-colors duration-500 relative overflow-hidden ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                            
                            <div className="mb-8">
                                <h2 className="text-xl font-black mb-1">Print Settings</h2>
                                <p className={`font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-500'}`}>Configure your stack exactly how you want it.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                        Pages Detected
                                    </label>
                                    <div className={`w-full p-4 rounded-xl border font-bold flex items-center justify-between ${
                                        isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-stone-100 border-stone-200 text-stone-500'
                                    }`}>
                                        {file ? `${printConfig.total_pages} Pages` : '--'}
                                        {file && <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-white' : 'text-stone-900'}`} />}
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                        Color Mode
                                    </label>
                                    <select
                                        value={printConfig.print_type}
                                        onChange={(e) => setPrintConfig({ ...printConfig, print_type: e.target.value as 'BW' | 'COLOR' })}
                                        className={`w-full p-4 rounded-xl border font-bold outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${
                                            isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:ring-white/30' : 'bg-white border-stone-200 text-stone-900 focus:ring-stone-900/20 shadow-sm'
                                        }`}
                                    >
                                        <option value="BW">Black & White</option>
                                        <option value="COLOR">Full Color</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                        Layout
                                    </label>
                                    <select
                                        value={printConfig.sided}
                                        onChange={(e) => setPrintConfig({ ...printConfig, sided: e.target.value as 'SINGLE' | 'DOUBLE' })}
                                        className={`w-full p-4 rounded-xl border font-bold outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${
                                            isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:ring-white/30' : 'bg-white border-stone-200 text-stone-900 focus:ring-stone-900/20 shadow-sm'
                                        }`}
                                    >
                                        <option value="SINGLE">Single-Sided</option>
                                        <option value="DOUBLE">Double-Sided</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold mb-2 uppercase tracking-wide ${isDark ? 'text-white/80' : 'text-stone-700'}`}>
                                        Copies
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={printConfig.copies}
                                        onChange={(e) => setPrintConfig({ ...printConfig, copies: parseInt(e.target.value) || 1 })}
                                        className={`w-full p-4 rounded-xl border font-bold outline-none transition-all focus:ring-2 ${
                                            isDark ? 'bg-[#0A0A0A] border-white/10 text-white focus:ring-white/30' : 'bg-white border-stone-200 text-stone-900 focus:ring-stone-900/20 shadow-sm'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleNextStep}
                            disabled={!file || locating}
                            className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                                isDark 
                                ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]' 
                                : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xl shadow-stone-900/20'
                            }`}
                        >
                            {locating ? (
                                <span className="flex items-center gap-2">
                                    <svg className={`animate-spin h-5 w-5 ${isDark ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Locating Shops...
                                </span>
                            ) : (
                                <>Find Shops <ArrowRight className="w-6 h-6" /></>
                            )}
                        </button>
                    </div>
                )}

                {/* ================= STEP 2: SHOP SELECTION ================= */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Select a Shop</h2>
                                <p className={`font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                    {searchType === 'nearby' ? 'Showing active shops near you.' : 'Showing all active shops.'}
                                </p>
                            </div>
                            <button onClick={() => setStep(1)} className={`font-bold text-sm border-b transition-colors ${isDark ? 'border-white hover:text-white/60 hover:border-white/60' : 'border-stone-900 hover:text-stone-500 hover:border-stone-500'}`}>
                                ← Back
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shops.length === 0 ? (
                                <div className={`col-span-full border rounded-[2rem] p-12 text-center font-medium ${isDark ? 'bg-[#111111] border-white/10 text-white/50' : 'bg-white border-stone-200 text-stone-500'}`}>
                                    <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    No active print shops found in this area.
                                </div>
                            ) : (
                                shops.map((shop) => {
                                    const exactPrice = getExactShopPrice(shop);
                                    const isConfigured = exactPrice !== null;
                                    const isSelected = selectedShopId === shop.id;

                                    return (
                                        <div
                                            key={shop.id}
                                            onClick={() => isConfigured && setSelectedShopId(shop.id)}
                                            className={`border rounded-[1.5rem] p-6 transition-all duration-300 flex flex-col justify-between min-h-[160px] ${
                                                !isConfigured 
                                                ? (isDark ? 'opacity-40 border-white/5 bg-transparent cursor-not-allowed' : 'opacity-50 border-stone-200 bg-stone-50 cursor-not-allowed')
                                                : isSelected
                                                    ? (isDark ? 'border-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer' : 'border-stone-900 ring-1 ring-stone-900 bg-stone-50 cursor-pointer shadow-md')
                                                    : (isDark ? 'border-white/10 bg-[#111111] hover:border-white/30 cursor-pointer' : 'border-stone-200 bg-white hover:border-stone-400 cursor-pointer shadow-sm')
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="font-bold text-xl leading-tight">{shop.name}</h3>
                                                    <p className={`text-sm mt-1 flex items-start gap-1 font-medium ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <span className="line-clamp-2">{shop.address}</span>
                                                    </p>
                                                    {!isConfigured && <p className="text-xs text-red-500 mt-3 font-bold uppercase tracking-wider">Prices not configured</p>}
                                                </div>
                                                
                                                {isConfigured && (
                                                    <div className="text-right shrink-0">
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Exact Price</span>
                                                        <div className={`text-2xl font-black ${isSelected ? '' : (isDark ? 'text-white/90' : 'text-stone-800')}`}>
                                                            ₹{exactPrice}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {shop.dist_meters && (
                                                <div className="mt-4 flex items-center">
                                                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-700'}`}>
                                                        {(shop.dist_meters / 1000).toFixed(1)} km away
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <button
                            disabled={!selectedShopId}
                            onClick={() => setStep(3)}
                            className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex items-center justify-center gap-3 ${
                                isDark 
                                ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                                : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xl shadow-stone-900/20'
                            }`}
                        >
                            Proceed to Checkout <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* ================= STEP 3: CHECKOUT & UPLOAD ================= */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-3xl font-black tracking-tight">Final Review</h2>
                            <button onClick={() => setStep(2)} disabled={uploading} className={`font-bold text-sm border-b transition-colors ${isDark ? 'border-white hover:text-white/60 hover:border-white/60' : 'border-stone-900 hover:text-stone-500 hover:border-stone-500'}`}>
                                ← Back
                            </button>
                        </div>

                        <div className={`border rounded-[2rem] p-8 sm:p-12 transition-colors duration-500 ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-stone-200 shadow-sm'}`}>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900'}`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Document</p>
                                    <p className="font-bold text-lg truncate">{file?.name}</p>
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-y-6 gap-x-4 border-y py-8 mb-8 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Destination Shop</p>
                                    <p className="font-bold">{shops.find(s => s.id === selectedShopId)?.name}</p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Color Mode</p>
                                    <p className="font-bold">{printConfig.print_type === 'BW' ? 'Black & White' : 'Full Color'}</p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Layout</p>
                                    <p className="font-bold">{printConfig.sided === 'SINGLE' ? 'Single-Sided' : 'Double-Sided'}</p>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Pages × Copies</p>
                                    <p className="font-bold">{printConfig.total_pages} × {printConfig.copies}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/50' : 'text-stone-500'}`}>Total Due</p>
                                    <p className="text-4xl font-black">₹{getExactShopPrice(shops.find(s => s.id === selectedShopId))}</p>
                                </div>
                                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                    Pay at counter
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={uploading}
                            className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                                isDark 
                                ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.15)]' 
                                : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xl shadow-stone-900/20'
                            }`}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <svg className={`animate-spin h-5 w-5 ${isDark ? 'text-black' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Uploading & Submitting...
                                </span>
                            ) : (
                                'Confirm & Submit Order'
                            )}
                        </button>
                    </div>
                )}

                {/* ================= STEP 4: SUCCESS ================= */}
                {step === 4 && (
                    <div className="animate-in zoom-in-95 duration-500 max-w-lg mx-auto mt-12">
                        <div className={`border rounded-[2.5rem] p-12 text-center transition-colors duration-500 ${isDark ? 'bg-[#111111] border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]' : 'bg-white border-stone-200 shadow-2xl shadow-stone-200/50'}`}>
                            
                            <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8 ${isDark ? 'bg-white text-black' : 'bg-stone-900 text-white'}`}>
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            
                            <h2 className="text-3xl font-black tracking-tight mb-4">Order Submitted!</h2>
                            <p className={`font-medium text-lg leading-relaxed mb-10 ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                Your document is securely on its way to the print shop. Keep your OTP ready for pickup.
                            </p>
                            
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setSelectedShopId(null);
                                    setStep(1);
                                }}
                                className={`w-full py-4 rounded-xl font-bold tracking-wide uppercase transition-all duration-300 border ${
                                    isDark 
                                    ? 'border-white/20 hover:bg-white/10 text-white' 
                                    : 'border-stone-300 hover:bg-stone-50 text-stone-900'
                                }`}
                            >
                                Print Another Document
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}