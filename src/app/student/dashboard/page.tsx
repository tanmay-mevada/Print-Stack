'use client'

import { useState } from 'react'
import { fetchAvailableShopsAction, submitOrderAction } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { PDFDocument } from 'pdf-lib'

export default function StudentDashboardPage() {
    // --- STATE ---
    const [step, setStep] = useState(1)
    const [file, setFile] = useState<File | null>(null)

    // Values strictly match your ENUMs and added total_pages
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

    // Shop Selection State
    const [locating, setLocating] = useState(false)
    const [shops, setShops] = useState<any[]>([])
    const [searchType, setSearchType] = useState<'nearby' | 'all'>('all')
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    // --- MATH HELPERS ---
    
    // Step 1: Approximate standard market price
    const approxPrice = (() => {
        const base = printConfig.print_type === 'COLOR' ? 10 : 2; // Est: ₹10 Color, ₹2 B&W
        const modifier = printConfig.sided === 'DOUBLE' ? 0.8 : 1; // Est: 20% off double-sided
        return ((base * modifier) * printConfig.total_pages * printConfig.copies).toFixed(2);
    })();

    // Step 2 & 3: Exact price based on specific shop config
    function getExactShopPrice(shop: any) {
        if (!shop?.pricing) return null;
        const base = printConfig.print_type === 'COLOR' ? shop.pricing.color_price : shop.pricing.bw_price;
        const modifier = printConfig.sided === 'DOUBLE' ? shop.pricing.double_side_modifier : 1;
        return ((base * modifier) * printConfig.total_pages * printConfig.copies).toFixed(2);
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0]
            if (selected.type !== 'application/pdf') {
                alert("Please upload a PDF file.")
                return
            }
            
            setFile(selected)

            // --- AUTO-DETECT PAGE COUNT ---
            try {
                // 1. Read the file into memory
                const arrayBuffer = await selected.arrayBuffer()
                // 2. Load it into the PDF parser (ignoring encryption just in case)
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
                // 3. Extract the exact page count
                const pageCount = pdfDoc.getPageCount()
                
                // 4. Update the config automatically!
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

        // Try to get location
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success: search with coordinates
                    loadShops(position.coords.latitude, position.coords.longitude)
                },
                (error) => {
                    console.warn("Location denied or failed. Loading all shops.", error)
                    // Fallback: search without coordinates (loads all)
                    loadShops()
                },
                { timeout: 5000 } // Don't wait forever
            )
        } else {
            // Fallback: browser doesn't support geolocation
            loadShops()
        }
    }

    async function handleCheckout() {
        if (!file || !selectedShopId) return
        setUploading(true)

        const supabase = createClient()

        // 1. Create a unique, URL-safe file name
        const fileExt = file.name.split('.').pop()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_')
        const uniqueFileName = `${Date.now()}-${safeFileName}.${fileExt}`
        const storagePath = `uploads/${uniqueFileName}`

        // 2. Upload the file directly to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('print_files')
            .upload(storagePath, file)

        if (uploadError) {
            alert("Upload failed: " + uploadError.message)
            setUploading(false)
            return
        }

        // 3. Save the Order to the Database
        const res = await submitOrderAction({
            shopId: selectedShopId,
            filePath: storagePath,
            config: printConfig 
        })

        if (res.success) {
            setStep(4) // Move to a Success Screen!
        } else {
            alert("Failed to submit order: " + res.error)
        }

        setUploading(false)
    }

    // --- UI ---
    return (
        <div className="p-8 font-sans max-w-4xl mx-auto text-gray-900">
            {/* Header & Progress */}
            <div className="flex justify-between items-center mb-8 border-b border-black pb-4">
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <div className="text-sm font-semibold text-gray-400 tracking-wide">
                    <span className={step === 1 ? "text-black" : ""}>1. UPLOAD</span> →{' '}
                    <span className={step === 2 ? "text-black" : ""}>2. SELECT SHOP</span> →{' '}
                    <span className={step === 3 ? "text-black" : ""}>3. CHECKOUT</span>
                </div>
            </div>

            {/* STEP 1: UPLOAD & SETTINGS */}
            {step === 1 && (
                <div className="space-y-8">
                    {/* File Upload - No BG, just clean borders */}
                    <div className="border border-gray-400 p-6">
                        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-sm">Document Upload</h2>
                        <div className="border border-dashed border-gray-400 p-8 text-center transition-colors hover:border-black">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-black file:bg-transparent file:text-black file:font-bold file:uppercase file:text-xs hover:file:bg-black hover:file:text-white cursor-pointer mb-4 transition-colors"
                            />
                            {file ? (
                                <p className="text-green-600 font-bold text-sm">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                            ) : (
                                <p className="text-gray-500 text-sm">Supported formats: .pdf (Max 10MB)</p>
                            )}
                        </div>
                    </div>

                    {/* Print Options */}
                    <div className="border border-gray-400 p-6 relative">
                        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-sm">Print Configuration</h2>
                        
                        {/* APPROXIMATE COST BADGE */}
                        <div className="absolute top-6 right-6 text-right">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Est. Cost</span>
                            <span className="text-2xl font-bold text-black">₹{approxPrice}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Auto-detected Page Count */}
                            <div>
                                <label className="block mb-2 font-semibold text-sm">Total Pages in PDF</label>
                                <div className="border border-gray-200 bg-gray-100 p-2 w-full text-gray-500 font-mono text-sm cursor-not-allowed">
                                    {file ? `${printConfig.total_pages} Pages (Auto-detected)` : 'Upload a PDF first'}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-semibold text-sm">Number of Copies</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={printConfig.copies}
                                    onChange={(e) => setPrintConfig({ ...printConfig, copies: parseInt(e.target.value) || 1 })}
                                    className="border border-gray-400 p-2 w-full focus:outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-semibold text-sm">Color Mode</label>
                                <select
                                    className="border border-gray-400 p-2 w-full focus:outline-none focus:border-black"
                                    value={printConfig.print_type}
                                    onChange={(e) => setPrintConfig({ ...printConfig, print_type: e.target.value as 'BW' | 'COLOR' })}
                                >
                                    <option value="BW">Black & White</option>
                                    <option value="COLOR">Full Color</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-2 font-semibold text-sm">Print Sides</label>
                                <select
                                    className="border border-gray-400 p-2 w-full focus:outline-none focus:border-black"
                                    value={printConfig.sided}
                                    onChange={(e) => setPrintConfig({ ...printConfig, sided: e.target.value as 'SINGLE' | 'DOUBLE' })}
                                >
                                    <option value="SINGLE">Single-Sided</option>
                                    <option value="DOUBLE">Double-Sided</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleNextStep}
                        disabled={!file || locating}
                        className="w-full bg-black text-white font-bold p-4 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors uppercase tracking-widest"
                    >
                        {locating ? 'Locating...' : 'Proceed to Shop Selection →'}
                    </button>
                </div>
            )}

            {/* STEP 2: SHOP SELECTION */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wider">Select a Print Shop</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchType === 'nearby'
                                    ? 'Showing shops within 5km of your current location.'
                                    : 'Showing all active shops.'}
                            </p>
                        </div>
                        <button onClick={() => setStep(1)} className="text-black border-b border-black font-bold text-sm hover:text-gray-600 hover:border-gray-600">
                            ← Back
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {shops.length === 0 ? (
                            <div className="border border-gray-400 p-8 text-center text-gray-500">
                                No active print shops found.
                            </div>
                        ) : (
                            shops.map((shop) => {
                                const exactPrice = getExactShopPrice(shop);
                                const isConfigured = exactPrice !== null;

                                return (
                                    <div
                                        key={shop.id}
                                        onClick={() => isConfigured && setSelectedShopId(shop.id)}
                                        className={`border p-5 transition-colors relative ${!isConfigured ? 'opacity-50 cursor-not-allowed border-gray-200' : selectedShopId === shop.id
                                            ? 'border-black ring-1 ring-black cursor-pointer'
                                            : 'border-gray-400 hover:border-black cursor-pointer'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{shop.name}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                                                {shop.phone && <p className="text-xs font-mono text-gray-500 mt-1">📞 {shop.phone}</p>}
                                                {!isConfigured && <p className="text-xs text-red-600 mt-2 font-bold uppercase tracking-wider">Pricing not configured by shop</p>}
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-2">
                                                {/* SHOP EXACT PRICE BADGE */}
                                                {isConfigured && (
                                                    <div className="text-xl font-bold text-black border-b-2 border-black">₹{exactPrice}</div>
                                                )}
                                                {shop.dist_meters && (
                                                    <div className="text-xs font-bold bg-gray-200 text-black px-2 py-1 mt-1">
                                                        {(shop.dist_meters / 1000).toFixed(1)} km away
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <button
                        disabled={!selectedShopId}
                        onClick={() => setStep(3)}
                        className="w-full bg-black text-white font-bold p-4 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors uppercase tracking-widest mt-6"
                    >
                        Proceed to Payment →
                    </button>
                </div>
            )}

            {/* STEP 3: CHECKOUT & UPLOAD */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-wider">Final Review</h2>
                        <button onClick={() => setStep(2)} disabled={uploading} className="text-black border-b border-black font-bold text-sm">
                            ← Back
                        </button>
                    </div>

                    <div className="border border-gray-400 p-6">
                        <h3 className="font-bold border-b border-gray-300 pb-2 mb-4 uppercase text-sm tracking-wider">Order Summary</h3>
                        <div className="space-y-3 text-sm">
                            <p><span className="font-bold text-gray-500 w-32 inline-block">File:</span> {file?.name}</p>
                            <p><span className="font-bold text-gray-500 w-32 inline-block">Color Mode:</span> {printConfig.print_type}</p>
                            <p><span className="font-bold text-gray-500 w-32 inline-block">Sides:</span> {printConfig.sided}</p>
                            <p><span className="font-bold text-gray-500 w-32 inline-block">Pages x Copies:</span> {printConfig.total_pages} x {printConfig.copies}</p>
                            <p><span className="font-bold text-gray-500 w-32 inline-block">Shop:</span> {shops.find(s => s.id === selectedShopId)?.name}</p>
                        </div>

                        {/* FINAL EXACT TOTAL */}
                        <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-end">
                            <span className="font-bold uppercase tracking-wider text-sm">Total Due</span>
                            <span className="text-3xl font-bold">₹{getExactShopPrice(shops.find(s => s.id === selectedShopId))}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={uploading}
                        className="w-full bg-black text-white font-bold p-4 hover:bg-gray-800 disabled:bg-gray-300 transition-colors uppercase tracking-widest"
                    >
                        {uploading ? 'UPLOADING & SUBMITTING...' : 'CONFIRM & SUBMIT ORDER'}
                    </button>
                </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
                <div className="border border-black p-12 text-center">
                    <h2 className="text-2xl font-bold text-black uppercase tracking-wider mb-2">Order Submitted!</h2>
                    <p className="text-gray-700 mb-6">Your document is securely on its way to the print shop.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-black text-white px-6 py-3 font-bold text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                        Print Another Document
                    </button>
                </div>
            )}
        </div>
    )
}