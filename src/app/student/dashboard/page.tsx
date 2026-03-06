"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { PDFDocument } from "pdf-lib";
import { fetchAvailableShopsAction, submitOrderAction } from "../actions";
import {
  Sun, Moon, Printer, LogOut, UploadCloud, FileText, CheckCircle2,
  MapPin, Store, ArrowRight, User, History, CreditCard, Clock,
  ChevronDown, Timer, Activity, Map, ExternalLink, Settings, XCircle, Eye, EyeOff, AlertCircle
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import dynamic from 'next/dynamic';
import NotificationListener from '@/components/NotificationListener'
import { Toaster } from 'react-hot-toast'

const ShopDisplayMap = dynamic(() => import('@/components/ShopDisplayMap'), { ssr: false });

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface Option { label: string; value: string; }

interface CustomSelectProps {
  label: string; value: string; options: Option[];
  onChange: (value: string) => void; isDark: boolean;
}

interface ShopPricing {
  bw_price: number; color_price: number; double_side_modifier: number;
}

interface Shop {
  id: string; name: string; address: string;
  latitude: number; longitude: number; map_link?: string;
  profile_pic?: string | null; pricing?: ShopPricing;
  is_active?: boolean; paused_until?: string | null;
  exactPriceNum?: number; exactPriceStr?: string | null;
  distanceNum?: number; distanceStr?: string | null;
}

interface Order {
  id: string; status: string; shop_id: string; student_id: string;
  created_at: string; file_path?: string; total_pages?: number;
  print_type?: string; total_price?: number; otp?: string;
  queue_position?: number; shops?: { name: string };
}

interface PrintConfig {
  print_type: "BW" | "COLOR" | "MIXED";
  sided: "SINGLE" | "DOUBLE" | "MIXED";
  copies: number;
  total_pages: number;
  color_pages?: string;
  bw_pages?: string;
  single_pages?: string;
  double_pages?: string;
}

// ============================================================================
// UTILITIES & MATH ENGINE
// ============================================================================
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; const dLat = (lat2 - lat1) * (Math.PI / 180); const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function parsePageRange(rangeStr: string, maxPages: number): Set<number> {
  const pages = new Set<number>();
  if (!rangeStr) return pages;

  const parts = rangeStr.split(',').map(p => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (start && end && start <= end) {
        for (let i = start; i <= Math.min(end, maxPages); i++) pages.add(i);
      }
    } else {
      const num = Number(part);
      if (num && num <= maxPages) pages.add(num);
    }
  }
  return pages;
}

// NEW: Real-time UX Validation Engine
function validateRangeInput(input: string, maxPages: number): { isValid: boolean, error?: string, parsedCount: number } {
  if (!input || !input.trim()) return { isValid: true, parsedCount: 0 };

  // Block letters and symbols immediately
  const regex = /^[0-9,\-\s]+$/;
  if (!regex.test(input)) return { isValid: false, error: "Only numbers, commas, and hyphens allowed." };

  const parts = input.split(',').map(p => p.trim()).filter(p => p !== '');
  const pages = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr, ...rest] = part.split('-');
      if (rest.length > 0) return { isValid: false, error: "Format error (e.g. use 1-5)." };
      if (!startStr || !endStr) return { isValid: false, error: "Incomplete range." };

      const start = parseInt(startStr);
      const end = parseInt(endStr);

      if (isNaN(start) || isNaN(end)) return { isValid: false, error: "Incomplete range." };
      if (start < 1 || end < 1) return { isValid: false, error: "Pages must be 1 or greater." };
      if (start > maxPages || end > maxPages) return { isValid: false, error: `Out of bounds (Max: ${maxPages}).` };
      if (start > end) return { isValid: false, error: "Start page must be smaller than end." };

      for (let i = start; i <= end; i++) pages.add(i);
    } else {
      const num = parseInt(part);
      if (isNaN(num)) return { isValid: false, error: "Invalid number." };
      if (num < 1) return { isValid: false, error: "Pages must be 1 or greater." };
      if (num > maxPages) return { isValid: false, error: `Out of bounds (Max: ${maxPages}).` };
      pages.add(num);
    }
  }

  return { isValid: true, parsedCount: pages.size };
}

function CustomSelect({ label, value, options, onChange, isDark }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o: Option) => o.value === value);

  return (
    <div ref={dropdownRef} className={`relative p-5 rounded-2xl border transition-all duration-300 ${isOpen ? 'z-50' : 'z-10'} ${isDark ? "bg-[#0A0A0A] border-white/10 hover:border-white/20" : "bg-stone-50 border-stone-200/60 hover:border-stone-300"} ${isOpen ? (isDark ? "ring-2 ring-white/20 border-white/20" : "ring-2 ring-stone-900/20 border-stone-900") : ""}`}>
      <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? "text-white/50" : "text-stone-500"}`}>{label}</label>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-transparent font-black text-xl tracking-tight outline-none cursor-pointer flex justify-between items-center select-none">
        {selectedOption?.label}
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <div className={`absolute left-0 right-0 top-[calc(100%+12px)] z-[999] rounded-2xl overflow-hidden shadow-2xl border py-2 animate-in fade-in zoom-in-95 duration-200 ${isDark ? "bg-[#18181b] border-white/10 shadow-black/80" : "bg-white border-stone-200 shadow-stone-300/50"}`}>
          {options.map((opt: Option) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`px-5 py-3.5 font-bold cursor-pointer transition-all flex items-center justify-between ${value === opt.value ? isDark ? "text-white bg-white/5" : "text-stone-900 bg-stone-50" : isDark ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"}`}>
              {opt.label}
              {value === opt.value && <CheckCircle2 className={`w-4 h-4 ${isDark ? "text-white" : "text-stone-900"}`} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopQueues, setShopQueues] = useState<Record<string, number>>({});
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"distance" | "price">("price");
  const [showInactiveShops, setShowInactiveShops] = useState(true);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const [isDraggingNav, setIsDraggingNav] = useState(false);

  const handleNavPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingNav || !mobileNavRef.current) return;
    const rect = mobileNavRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1));
    const section = Math.floor((x / rect.width) * 3);
    if (section === 0 && step !== 1) setStep(1);
    else if (section === 1 && step !== 2 && file) setStep(2);
    else if (section === 2 && step !== 3 && file && selectedShopId) setStep(3);
  };

  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    print_type: "BW", sided: "SINGLE", copies: 1, total_pages: 1,
    color_pages: "", double_pages: ""
  });

  // Calculate validations on every render
  const colorValidation = validateRangeInput(printConfig.color_pages || '', printConfig.total_pages);
  const doubleValidation = validateRangeInput(printConfig.double_pages || '', printConfig.total_pages);

  const [locating, setLocating] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchType, setSearchType] = useState<"nearby" | "all">("all");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const shopsRef = useRef(shops);
  useEffect(() => { shopsRef.current = shops; }, [shops]);

  const fetchUserOrdersAndProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: myOrders } = await supabase.from("orders").select("*, shops(name)").eq("student_id", user.id).order("created_at", { ascending: false });
      if (myOrders) {
        const enhancedOrders: Order[] = await Promise.all(myOrders.map(async (order: Order) => {
          if (['PAID', 'PRINTING'].includes(order.status)) {
            const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', order.shop_id).in('status', ['PAID', 'PRINTING']).lt('created_at', order.created_at);
            return { ...order, queue_position: count || 0 };
          }
          return order;
        }));
        setOrders(enhancedOrders);
      }
      const { data: profile } = await supabase.from('profiles').select('profile_pic').eq('id', user.id).single();
      if (profile?.profile_pic) setUserAvatar(profile.profile_pic);
    }
  }, []);

  const fetchShopQueues = useCallback(async (availableShops: Shop[]) => {
    if (availableShops.length === 0) return;
    const shopIds = availableShops.map((s: Shop) => s.id);
    const supabase = createClient();
    const { data } = await supabase.from("orders").select("shop_id").in("shop_id", shopIds).in("status", ["PAID", "PRINTING"]);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((order: { shop_id: string }) => { counts[order.shop_id] = (counts[order.shop_id] || 0) + 1; });
      setShopQueues(counts);
    }
  }, []);

  useEffect(() => {
    void fetchUserOrdersAndProfile();
    const supabase = createClient();
    const channel = supabase.channel('live-student-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchUserOrdersAndProfile();
        if (shopsRef.current.length > 0) void fetchShopQueues(shopsRef.current);
      }).subscribe();
    const intervalId = setInterval(() => {
      void fetchUserOrdersAndProfile();
      if (shopsRef.current.length > 0) void fetchShopQueues(shopsRef.current);
    }, 8000);
    return () => { supabase.removeChannel(channel); clearInterval(intervalId); };
  }, [fetchUserOrdersAndProfile, fetchShopQueues]);

  // ==========================================================================
  // PRICING ENGINE
  // ==========================================================================
  const getExactShopPrice = (shop: Shop | undefined) => {
    if (!shop?.pricing) return null;
    let totalCostForOneCopy = 0;

    if (printConfig.print_type === 'MIXED' || printConfig.sided === 'MIXED') {
      const colorSet = parsePageRange(printConfig.color_pages || '', printConfig.total_pages);
      const doubleSet = parsePageRange(printConfig.double_pages || '', printConfig.total_pages);

      for (let i = 1; i <= printConfig.total_pages; i++) {
        const isColor = printConfig.print_type === 'COLOR' || (printConfig.print_type === 'MIXED' && colorSet.has(i));
        const isDouble = printConfig.sided === 'DOUBLE' || (printConfig.sided === 'MIXED' && doubleSet.has(i));

        const basePrice = isColor ? shop.pricing.color_price : shop.pricing.bw_price;
        const modifier = isDouble ? shop.pricing.double_side_modifier : 1;
        totalCostForOneCopy += (basePrice * modifier);
      }
    } else {
      let pricePerPage = printConfig.print_type === 'COLOR' ? shop.pricing.color_price : shop.pricing.bw_price;
      let sideModifier = printConfig.sided === 'DOUBLE' ? shop.pricing.double_side_modifier : 1;
      totalCostForOneCopy = (pricePerPage * sideModifier) * printConfig.total_pages;
    }

    return (totalCostForOneCopy * printConfig.copies).toFixed(2);
  }

  const getPriceBreakdown = (shop: Shop | undefined) => {
    if (!shop?.pricing) return null;

    let colorCount = 0;
    let bwCount = 0;
    let doubleCount = 0;

    let baseCostForOneCopy = 0;
    let doubleSidedDifference = 0;

    const colorSet = parsePageRange(printConfig.color_pages || '', printConfig.total_pages);
    const doubleSet = parsePageRange(printConfig.double_pages || '', printConfig.total_pages);

    for (let i = 1; i <= printConfig.total_pages; i++) {
      const isColor = printConfig.print_type === 'COLOR' || (printConfig.print_type === 'MIXED' && colorSet.has(i));
      const isDouble = printConfig.sided === 'DOUBLE' || (printConfig.sided === 'MIXED' && doubleSet.has(i));

      if (isColor) colorCount++; else bwCount++;
      if (isDouble) doubleCount++;

      const basePrice = isColor ? shop.pricing.color_price : shop.pricing.bw_price;
      const modifier = isDouble ? shop.pricing.double_side_modifier : 1;

      baseCostForOneCopy += basePrice;

      if (isDouble) {
        doubleSidedDifference += (basePrice * modifier) - basePrice;
      }
    }

    const finalTotalForOneCopy = baseCostForOneCopy + doubleSidedDifference;

    return {
      colorCount, bwCount, doubleCount,
      colorPrice: shop.pricing.color_price,
      bwPrice: shop.pricing.bw_price,
      doubleSidedDifference,
      finalTotalForOneCopy
    };
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") return alert("Please upload a PDF file.");
      setFile(selected);
      try {
        const arrayBuffer = await selected.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setPrintConfig((prev) => ({ ...prev, total_pages: pdfDoc.getPageCount() }));
      } catch (error) { alert("We couldn't read the page count of this PDF."); }
    }
  }

  async function loadShops(lat?: number, lng?: number) {
    const res = await fetchAvailableShopsAction(lat, lng);
    if (res.shops) {
      setShops(res.shops as Shop[]);
      setSearchType(res.type as "nearby" | "all");
      fetchShopQueues(res.shops as Shop[]);
    }
    setLocating(false);
    setStep(2);
  }

  function handleNextStep() {
    setLocating(true);
    const getLocation = () => new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) return reject("No Geolocation Support");
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
    getLocation()
      .then(async (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy("distance");
        await loadShops(pos.coords.latitude, pos.coords.longitude);
      })
      .catch(async (err) => {
        setUserLocation(null);
        setSortBy("price");
        await loadShops();
      });
  }

  async function handleCheckout() {
    if (!file || !selectedShopId) return;
    setUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
    const storagePath = `uploads/${Date.now()}-${safeFileName}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("print_files").upload(storagePath, file);

    if (uploadError) { alert("Upload failed: " + uploadError.message); setUploading(false); return; }

    const res = await submitOrderAction({ shopId: selectedShopId, filePath: storagePath, config: printConfig });
    if (res.success && res.paymentUrl) window.location.href = res.paymentUrl;
    else setStep(4);
    setUploading(false);
  }

  const activeOrders = orders.filter((order) => order.status !== "COMPLETED").slice(0, 2);

  const getStatusProgress = (status: string, position?: number) => {
    switch (status) {
      case 'CREATED': case 'PENDING': return { width: '25%', text: 'Awaiting Payment' };
      case 'PAID': case 'PRINTING':
        if (position === 0) return { width: '80%', text: 'Printing Now' };
        if (position === 1) return { width: '60%', text: 'Next in Line' };
        return { width: '45%', text: 'In Queue' };
      case 'READY': return { width: '100%', text: 'Ready for Pickup!' };
      default: return { width: '0%', text: status };
    }
  }

  const sortedShops = [...shops]
    .filter((shop: Shop) => {
      const isClosed = shop.is_active === false || shop.is_active === null;
      const isPaused = shop.paused_until && new Date(shop.paused_until) > new Date();
      const isUnavailable = isClosed || isPaused;
      if (!showInactiveShops && isUnavailable) return false;
      return true;
    })
    .map((shop: Shop) => {
      const priceStr = getExactShopPrice(shop);
      const distStr = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : null;
      return {
        ...shop, exactPriceNum: priceStr ? parseFloat(priceStr) : Infinity, exactPriceStr: priceStr,
        distanceNum: distStr ? parseFloat(distStr) : Infinity, distanceStr: distStr
      };
    })
    .sort((a, b) => {
      const aUnavailable = a.is_active === false || a.is_active === null || !!(a.paused_until && new Date(a.paused_until) > new Date());
      const bUnavailable = b.is_active === false || b.is_active === null || !!(b.paused_until && new Date(b.paused_until) > new Date());
      if (aUnavailable && !bUnavailable) return 1;
      if (!aUnavailable && bUnavailable) return -1;

      const aConfigured = a.exactPriceStr !== null;
      const bConfigured = b.exactPriceStr !== null;
      if (!aConfigured && bConfigured) return 1;
      if (aConfigured && !bConfigured) return -1;

      if (sortBy === "distance") {
        const distA = a.distanceNum === Infinity ? 99999 : a.distanceNum;
        const distB = b.distanceNum === Infinity ? 99999 : b.distanceNum;
        return distA - distB;
      }
      return a.exactPriceNum - b.exactPriceNum;
    });

  // Calculate if we should block the user from moving to Step 2
  const isNextDisabled =
    !file ||
    locating ||
    (printConfig.print_type === 'MIXED' && (!colorValidation.isValid || colorValidation.parsedCount === 0)) ||
    (printConfig.sided === 'MIXED' && (!doubleValidation.isValid || doubleValidation.parsedCount === 0));

  return (
    <div className={`min-h-screen font-sans transition-all duration-700 pb-32 sm:pb-20 ${isDark ? "bg-[#050505] text-white selection:bg-white/20" : "bg-[#f4f4f0] text-stone-900 selection:bg-stone-900/20"}`}>

      {/* FLOATING MOBILE PROGRESS BAR */}
      {step < 4 && (
        <div className="fixed sm:hidden bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[340px] z-[100] animate-in slide-in-from-bottom-10 duration-700">
          <div ref={mobileNavRef} onPointerDown={(e) => { setIsDraggingNav(true); (e.target as HTMLElement).releasePointerCapture(e.pointerId); }} onPointerMove={handleNavPointerMove} onPointerUp={() => setIsDraggingNav(false)} onPointerLeave={() => setIsDraggingNav(false)} onPointerCancel={() => setIsDraggingNav(false)} className={`relative flex items-center p-1.5 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl transition-colors duration-500 touch-none select-none overflow-hidden cursor-pointer ${isDark ? "bg-[#111111]/95 border-white/10 shadow-black/80" : "bg-white/95 border-stone-200 shadow-stone-300/50"}`}>
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(33.333%-4px)] rounded-[2rem] transition-all duration-300 ease-out shadow-sm pointer-events-none ${isDark ? "bg-[#2a2a2a]" : "bg-stone-100"}`} style={{ left: step === 1 ? "6px" : step === 2 ? "calc(33.333% + 2px)" : "calc(66.666% - 2px)" }} />
            <div className="relative z-10 grid grid-cols-3 w-full">
              <button onClick={() => setStep(1)} className={`flex flex-col items-center justify-center w-full py-3.5 transition-all duration-300 ${step === 1 ? isDark ? "text-white" : "text-stone-900" : step > 1 ? isDark ? "text-white hover:text-white/80" : "text-stone-900 hover:text-stone-700" : isDark ? "text-white/40" : "text-stone-400"}`}>
                {step > 1 ? <CheckCircle2 className="w-6 h-6 mb-1 text-green-500 animate-in zoom-in duration-300" /> : <UploadCloud className={`w-6 h-6 mb-1 transition-transform duration-300 ${step === 1 ? "scale-110" : ""}`} strokeWidth={step === 1 ? 2.5 : 2} />}
                <span className="text-[10px] font-black tracking-widest uppercase">Upload</span>
              </button>
              <button onClick={() => { if (!isNextDisabled) setStep(2); }} className={`flex flex-col items-center justify-center w-full py-3.5 transition-all duration-300 ${step === 2 ? isDark ? "text-white" : "text-stone-900" : step > 2 ? isDark ? "text-white hover:text-white/80" : "text-stone-900 hover:text-stone-700" : isDark ? "text-white/40" : "text-stone-400"} ${isNextDisabled && step !== 2 ? "opacity-40 cursor-not-allowed" : ""}`}>
                {step > 2 ? <CheckCircle2 className="w-6 h-6 mb-1 text-green-500 animate-in zoom-in duration-300" /> : <Store className={`w-6 h-6 mb-1 transition-transform duration-300 ${step === 2 ? "scale-110" : ""}`} strokeWidth={step === 2 ? 2.5 : 2} />}
                <span className="text-[10px] font-black tracking-widest uppercase">Shop</span>
              </button>
              <button onClick={() => { if (file && selectedShopId) setStep(3); }} className={`flex flex-col items-center justify-center w-full py-3.5 transition-all duration-300 ${step === 3 ? isDark ? "text-white" : "text-stone-900" : isDark ? "text-white/40" : "text-stone-400"} ${(!file || !selectedShopId) && step !== 3 ? "opacity-40 cursor-not-allowed" : ""}`}>
                <CreditCard className={`w-6 h-6 mb-1 transition-transform duration-300 ${step === 3 ? "scale-110" : ""}`} strokeWidth={step === 3 ? 2.5 : 2} />
                <span className="text-[10px] font-black tracking-widest uppercase">Pay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 max-w-5xl mx-auto relative">
        {/* ================= NAVBAR ================= */}
        <div className={`flex justify-between items-center pb-6 mb-10 relative transition-colors duration-500 border-b ${isDark ? "border-white/10" : "border-stone-200/60"}`}>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <img src={isDark ? "/pblackx.png" : "/pwhitex.png"} alt="PrintStack Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform duration-300 group-hover:scale-110" />
              <span className={`font-bold text-lg sm:text-xl tracking-tight transition-colors ${isDark ? "text-white" : "text-stone-900"}`}>PrintStack</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <button onClick={toggleTheme} className={`p-3 rounded-full transition-all duration-300 hover:scale-105 ${isDark ? "bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" : "bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50"}`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative" ref={profileDropdownRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 hover:scale-105 ${isDark ? "bg-white/5 hover:bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ring-1 ring-white/10" : "bg-white hover:bg-stone-50 text-stone-900 shadow-sm border border-stone-200/50"}`}>
                {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
              </button>
              {isProfileOpen && (
                <div className={`absolute right-0 mt-4 w-60 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl transition-colors duration-300 animate-in fade-in slide-in-from-top-2 ${isDark ? "bg-[#111111]/90 border border-white/10 ring-1 ring-white/5" : "bg-white/90 border border-stone-200/50 shadow-stone-300/50"}`}>
                  <div className={`p-2 border-b ${isDark ? "border-white/10" : "border-stone-100"}`}>
                    <Link href="/student/profile" onClick={() => setIsProfileOpen(false)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold transition-all ${isDark ? "hover:bg-white/10 text-white/80 hover:text-white" : "hover:bg-stone-50 text-stone-700 hover:text-stone-900"}`}><Settings className="w-4 h-4 opacity-70" /> Edit Profile</Link>
                    <Link href="/student/orders" onClick={() => setIsProfileOpen(false)} className={`w-full flex items-center gap-3 p-3.5 mt-1 rounded-xl text-sm font-bold transition-all ${isDark ? "hover:bg-white/10 text-white/80 hover:text-white" : "hover:bg-stone-50 text-stone-700 hover:text-stone-900"}`}><History className="w-4 h-4 opacity-70" /> Order History</Link>
                  </div>
                  <div className="p-2">
                    <form action={logoutAction}>
                      <button type="submit" className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold transition-all ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`}><LogOut className="w-4 h-4 opacity-70" /> Log Out</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= DESKTOP PROGRESS TRACKER ================= */}
        {step < 4 && (
          <div className="hidden sm:flex justify-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className={`inline-flex items-center p-2 rounded-full border backdrop-blur-xl shadow-xl transition-all duration-500 ${isDark ? "bg-[#111111]/80 border-white/10 ring-1 ring-white/5" : "bg-white/90 border-stone-200 shadow-stone-200/50"}`}>
              <button onClick={() => setStep(1)} className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${step === 1 ? isDark ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-stone-900 text-white shadow-lg" : step > 1 ? isDark ? "text-white hover:bg-white/10" : "text-stone-900 hover:bg-stone-100" : isDark ? "text-white/40" : "text-stone-400"}`}>
                {step > 1 ? <CheckCircle2 className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} /> : <UploadCloud className="w-5 h-5" />}
                <span className="text-sm font-black tracking-widest uppercase">1. Upload</span>
              </button>
              <div className={`w-8 h-[2px] rounded-full mx-2 ${isDark ? "bg-white/10" : "bg-stone-200"}`} />
              <button onClick={() => { if (!isNextDisabled) setStep(2); }} disabled={isNextDisabled} className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${step === 2 ? isDark ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-stone-900 text-white shadow-lg" : step > 2 ? isDark ? "text-white hover:bg-white/10" : "text-stone-900 hover:bg-stone-100" : isDark ? "text-white/40" : "text-stone-400"}`}>
                {step > 2 ? <CheckCircle2 className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} /> : <Store className="w-5 h-5" />}
                <span className="text-sm font-black tracking-widest uppercase">2. Shop</span>
              </button>
              <div className={`w-8 h-[2px] rounded-full mx-2 ${isDark ? "bg-white/10" : "bg-stone-200"}`} />
              <button onClick={() => { if (file && selectedShopId) setStep(3); }} disabled={!file || !selectedShopId} className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${step === 3 ? isDark ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-stone-900 text-white shadow-lg" : isDark ? "text-white/40" : "text-stone-400"}`}>
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-black tracking-widest uppercase">3. Pay</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 1: UPLOAD & CONFIGURATION ================= */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`border rounded-[2.5rem] p-6 sm:p-10 transition-all duration-500 backdrop-blur-xl ${isDark ? "bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5" : "bg-white border-stone-200/60 shadow-xl shadow-stone-200/40"}`}>
              <h2 className="text-2xl font-black mb-6 tracking-tight">Document Upload</h2>
              <label className={`relative overflow-hidden border-2 border-dashed rounded-[2rem] p-12 sm:p-20 flex flex-col items-center justify-center cursor-pointer group transition-all duration-500 ${isDark ? "border-white/15 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05]" : "border-stone-300 hover:border-stone-500 bg-stone-50/50 hover:bg-stone-100"}`}>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl transition-transform duration-500 group-hover:scale-110 ${isDark ? "bg-gradient-to-br from-white/20 to-white/5 text-white ring-1 ring-white/20" : "bg-gradient-to-br from-stone-100 to-white text-stone-900 ring-1 ring-stone-200 shadow-stone-200"}`}>
                      <FileText className="w-10 h-10 drop-shadow-md" />
                    </div>
                    <p className="font-black text-xl text-center mb-2 tracking-tight">{file.name}</p>
                    <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-green-400" : "text-green-600"}`}>{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-xl ${isDark ? "bg-white/5 text-white/50 group-hover:text-white group-hover:bg-white/10 ring-1 ring-white/10" : "bg-stone-100 text-stone-400 group-hover:text-stone-900 group-hover:bg-white ring-1 ring-stone-200"}`}>
                      <UploadCloud className="w-10 h-10" />
                    </div>
                    <p className="font-black text-xl text-center mb-2 tracking-tight">Click to browse PDF</p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-stone-400"}`}>Max file size: 10MB</p>
                  </div>
                )}
              </label>
            </div>

            <div className={`border rounded-[2.5rem] p-6 sm:p-10 relative z-20 backdrop-blur-xl transition-all duration-500 ${isDark ? "bg-[#111111]/60 border-white/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5" : "bg-white border-stone-200/60 shadow-xl shadow-stone-200/40"}`}>              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-2">Print Settings</h2>
                <p className={`font-medium text-sm ${isDark ? "text-white/60" : "text-stone-500"}`}>Configure your stack exactly how you want it.</p>
              </div>
            </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${isDark ? "bg-[#0A0A0A] border-white/10 hover:border-white/20" : "bg-stone-50 border-stone-200/60 hover:border-stone-300"}`}>
                  <label className={`block text-[10px] font-bold mb-3 uppercase tracking-widest ${isDark ? "text-white/50" : "text-stone-500"}`}>Pages Detected</label>
                  <div className="font-black text-lg flex items-center justify-between">
                    {file ? `${printConfig.total_pages} Pages` : "--"}
                    {file && <CheckCircle2 className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />}
                  </div>
                </div>

                <CustomSelect
                  label="Color Mode"
                  value={printConfig.print_type}
                  options={[{ label: "Black & White", value: "BW" }, { label: "Full Color", value: "COLOR" }, { label: "Mixed / Custom", value: "MIXED" }]}
                  onChange={(val: string) => setPrintConfig({ ...printConfig, print_type: val as "BW" | "COLOR" | "MIXED" })}
                  isDark={isDark}
                />

                <CustomSelect
                  label="Layout"
                  value={printConfig.sided}
                  options={[{ label: "Single-Sided", value: "SINGLE" }, { label: "Double-Sided", value: "DOUBLE" }, { label: "Mixed / Custom", value: "MIXED" }]}
                  onChange={(val: string) => setPrintConfig({ ...printConfig, sided: val as "SINGLE" | "DOUBLE" | "MIXED" })}
                  isDark={isDark}
                />

                <div className={`p-5 rounded-2xl border transition-all duration-300 focus-within:ring-2 ${isDark ? "bg-[#0A0A0A] border-white/10 hover:border-white/20 focus-within:ring-white/30" : "bg-stone-50 border-stone-200/60 hover:border-stone-300 focus-within:ring-stone-900/20"}`}>
                  <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? "text-white/50" : "text-stone-500"}`}>Copies</label>
                  <input type="number" min="1" max="100" value={printConfig.copies} onChange={(e) => setPrintConfig({ ...printConfig, copies: parseInt(e.target.value) || 1 })} className="w-full bg-transparent font-black text-lg outline-none cursor-pointer" />
                </div>

                {/* UX IMPROVED: COLOR PAGES INPUT */}
                {printConfig.print_type === "MIXED" && (
                  <div className={`p-5 rounded-2xl border transition-all duration-300 col-span-1 sm:col-span-2 lg:col-span-4 animate-in fade-in zoom-in-95 focus-within:ring-2 ${!colorValidation.isValid ? (isDark ? "border-red-500/50 focus-within:ring-red-500/30 bg-red-500/5" : "border-red-400 focus-within:ring-red-400/30 bg-red-50") :
                      colorValidation.parsedCount > 0 ? (isDark ? "border-yellow-500/50 focus-within:ring-yellow-500/30 bg-yellow-500/5" : "border-yellow-400 focus-within:ring-yellow-400/30 bg-yellow-50") :
                        (isDark ? "bg-[#0A0A0A] border-white/10 focus-within:ring-white/30" : "bg-stone-50 border-stone-200/60 focus-within:ring-stone-900/20")
                    }`}>
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? "text-yellow-500/80" : "text-yellow-600"}`}>Color Pages (e.g. 1, 3-5)</label>
                    <input
                      type="text"
                      placeholder={`1-${printConfig.total_pages}`}
                      value={printConfig.color_pages || ''}
                      onChange={(e) => setPrintConfig({ ...printConfig, color_pages: e.target.value })}
                      className="w-full bg-transparent font-black text-xl outline-none placeholder:opacity-30"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-stone-500'}`}>*All unlisted pages will be B&W.</p>
                      {!colorValidation.isValid ? (
                        <p className="text-[10px] font-bold text-red-500 animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {colorValidation.error}</p>
                      ) : colorValidation.parsedCount > 0 ? (
                        <p className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {colorValidation.parsedCount} pages selected</p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* UX IMPROVED: DOUBLE-SIDED PAGES INPUT */}
                {printConfig.sided === "MIXED" && (
                  <div className={`p-5 rounded-2xl border transition-all duration-300 col-span-1 sm:col-span-2 lg:col-span-4 animate-in fade-in zoom-in-95 focus-within:ring-2 ${!doubleValidation.isValid ? (isDark ? "border-red-500/50 focus-within:ring-red-500/30 bg-red-500/5" : "border-red-400 focus-within:ring-red-400/30 bg-red-50") :
                      doubleValidation.parsedCount > 0 ? (isDark ? "border-indigo-500/50 focus-within:ring-indigo-500/30 bg-indigo-500/5" : "border-indigo-400 focus-within:ring-indigo-400/30 bg-indigo-50") :
                        (isDark ? "bg-[#0A0A0A] border-white/10 focus-within:ring-white/30" : "bg-stone-50 border-stone-200/60 focus-within:ring-stone-900/20")
                    }`}>
                    <label className={`block text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Double-Sided Pages (e.g. 2-10)</label>
                    <input
                      type="text"
                      placeholder={`2-${printConfig.total_pages}`}
                      value={printConfig.double_pages || ''}
                      onChange={(e) => setPrintConfig({ ...printConfig, double_pages: e.target.value })}
                      className="w-full bg-transparent font-black text-xl outline-none placeholder:opacity-30"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-stone-500'}`}>*All unlisted pages will be Single-Sided.</p>
                      {!doubleValidation.isValid ? (
                        <p className="text-[10px] font-bold text-red-500 animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {doubleValidation.error}</p>
                      ) : doubleValidation.parsedCount > 0 ? (
                        <p className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {doubleValidation.parsedCount} pages selected</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleNextStep} disabled={isNextDisabled} className={`relative w-full py-5 rounded-[2rem] font-black text-lg tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${isDark ? "bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1" : "bg-stone-900 text-white hover:bg-black shadow-xl hover:-translate-y-1"}`}>
              <span className="relative z-10 flex items-center gap-3">
                {locating ? <><Activity className="w-5 h-5 animate-pulse" /> Locating nearby shops...</> : <>Find Print Shops <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" /></>}
              </span>
            </button>

            {/* LIVE ZOMATO-STYLE ORDER TRACKER */}
            {activeOrders.length > 0 && (
              <div className="pt-12">
                <div className="flex justify-between items-end mb-8 px-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></div>
                      <h3 className="text-2xl font-black tracking-tight">Active Stack</h3>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-stone-400"}`}>Orders currently processing</p>
                  </div>
                  <Link href="/student/orders" className={`text-xs font-bold uppercase tracking-widest border-b transition-colors ${isDark ? "border-white/30 text-white/60 hover:text-white hover:border-white" : "border-stone-300 text-stone-500 hover:text-stone-900 hover:border-stone-900"}`}>View History</Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activeOrders.map((order) => {
                    const fileName = order.file_path ? order.file_path.split("-").slice(1).join("-") : "Document.pdf";
                    const progress = getStatusProgress(order.status, order.queue_position);

                    return (
                      <div key={order.id} className={`p-6 rounded-[2rem] border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isDark ? "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10" : "bg-white border-stone-200 shadow-sm hover:shadow-md"}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? "text-white/40" : "text-stone-400"}`}>
                              <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="font-black text-xl tracking-tight mb-1">{order.shops?.name || "Print Shop"}</p>
                            <div className={`flex items-center gap-2 text-sm font-bold truncate max-w-[200px] sm:max-w-[250px] ${isDark ? "text-white/70" : "text-stone-600"}`}>
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate">{fileName}</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${order.status === "READY" ? isDark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700" : isDark ? "bg-white/10 border-white/10 text-white" : "bg-stone-100 border-stone-200 text-stone-700"}`}>
                            {order.status === 'READY' ? 'READY' : progress.text}
                          </span>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-end">
                            {order.status === 'READY' ? (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest animate-pulse border ${isDark ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-600"}`}>OTP: {order.otp || 'Check Email'}</span>
                            ) : (
                              <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-80 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                <Activity className="w-3 h-3 animate-spin" />
                                {order.queue_position === 0 ? "Printing Now" : `${order.queue_position} Ahead (~${(order.queue_position || 0) * 3} min)`}
                              </span>
                            )}
                          </div>
                          <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-stone-100'}`}>
                            <div className={`h-full transition-all duration-1000 ease-out ${order.status === 'READY' ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: progress.width }} />
                          </div>
                        </div>

                        <div className="flex justify-between items-end pt-4 border-t border-dashed border-current border-opacity-20">
                          <div className={`text-sm font-bold ${isDark ? "text-white/60" : "text-stone-500"}`}>{order.total_pages} Pg • {order.print_type === 'MIXED' ? 'MIXED COLOR' : order.print_type}</div>
                          <div className="font-black text-2xl tracking-tighter">₹{order.total_price}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: SHOP SELECTION ================= */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-2 px-2">
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">Select a Shop</h2>
                <p className={`font-bold text-xs uppercase tracking-widest ${isDark ? "text-white/40" : "text-stone-400"}`}>
                  {searchType === 'nearby' ? 'Showing shops near you' : 'Showing all available shops'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <button onClick={() => setShowInactiveShops(!showInactiveShops)} className={`w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border ${showInactiveShops ? isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-stone-100 border-stone-300 text-stone-900' : isDark ? 'border-white/10 text-white/40 hover:text-white/80' : 'border-stone-200 text-stone-400 hover:text-stone-600'}`}>
                  {showInactiveShops ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showInactiveShops ? 'Hide Inactive' : 'Show Inactive'}
                </button>

                <div className={`flex items-center p-1 rounded-xl border w-full sm:w-auto ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-stone-200'}`}>
                  <button onClick={() => userLocation && setSortBy('distance')} disabled={!userLocation} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${sortBy === 'distance' ? isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900' : isDark ? 'text-white/40 hover:text-white/80' : 'text-stone-400 hover:text-stone-600'} ${!userLocation && 'opacity-30 cursor-not-allowed'}`}>Distance</button>
                  <button onClick={() => setSortBy('price')} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${sortBy === 'price' ? isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-900' : isDark ? 'text-white/40 hover:text-white/80' : 'text-stone-400 hover:text-stone-600'}`}>Price</button>
                </div>

                <button onClick={() => setStep(1)} className={`shrink-0 font-bold text-xs uppercase tracking-widest border-b transition-all hidden sm:block ${isDark ? "border-white/50 hover:border-white" : "border-stone-400 hover:border-stone-900"}`}>← Back</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-300px)] min-h-[600px]">

              <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-24 lg:pb-0">
                {sortedShops.map((shop: Shop) => {
                  const isClosed = shop.is_active === false || shop.is_active === null;
                  const isPaused = !!(shop.paused_until && new Date(shop.paused_until) > new Date());
                  const isUnavailable = isClosed || isPaused;
                  const isConfigured = shop.exactPriceStr !== null && shop.exactPriceStr !== undefined;

                  const isSelected = selectedShopId === shop.id;
                  const queueCount = shopQueues[shop.id] || 0;
                  const waitMins = queueCount * 3;

                  let mapUrl = shop.map_link || `https://www.google.com/maps/dir/?api=1&destination=$${shop.latitude},${shop.longitude}`;
                  if (shop.map_link && !shop.map_link.startsWith('http')) mapUrl = `https://${shop.map_link}`;

                  return (
                    <div
                      key={shop.id}
                      onClick={() => { if (isConfigured && !isUnavailable) setSelectedShopId(shop.id); }}
                      className={`relative border rounded-3xl p-4 sm:p-5 transition-all duration-300 flex flex-col shrink-0 overflow-hidden ${isUnavailable ? `opacity-60 grayscale-[0.5] cursor-not-allowed ${isDark ? "bg-[#111111]/40 border-white/5" : "bg-stone-50 border-stone-200"}` :
                          !isConfigured ? "opacity-40 grayscale cursor-not-allowed" :
                            isSelected ? (isDark ? "bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/50 cursor-default" : "border-stone-900 ring-1 ring-stone-900 bg-white shadow-md cursor-default") :
                              (isDark ? "border-white/10 bg-[#111111]/80 hover:bg-white/5 cursor-pointer" : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm cursor-pointer")
                        }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 w-full">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-100'} ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}>
                          {shop.profile_pic ? (
                            <img src={shop.profile_pic} alt={shop.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-stone-300'}`} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-start">
                          <div className="flex justify-between items-start gap-2 w-full">
                            <h3 className="font-black text-lg tracking-tight truncate leading-tight mt-0.5">{shop.name}</h3>
                            {isConfigured && !isUnavailable && (
                              <div className="text-right shrink-0">
                                <div className="text-lg sm:text-xl font-black tracking-tighter leading-none">₹{shop.exactPriceStr}</div>
                              </div>
                            )}
                          </div>

                          <p className={`text-xs font-medium flex items-center gap-1 mt-1 truncate ${isDark ? "text-white/50" : "text-stone-500"}`}>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{shop.address}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {shop.distanceStr && (
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                {shop.distanceStr} km
                              </span>
                            )}

                            {isPaused ? (
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                                <Clock className="w-2.5 h-2.5" /> Reopens at {new Date(shop.paused_until!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : isClosed ? (
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                <XCircle className="w-2.5 h-2.5" /> Temporarily Closed
                              </span>
                            ) : isConfigured ? (
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 ${queueCount === 0 ? isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-600' : queueCount > 5 ? isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600' : isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
                                {queueCount === 0 ? <><CheckCircle2 className="w-2.5 h-2.5" /> No Wait</> : <><Timer className="w-2.5 h-2.5" /> ~{waitMins} min</>}
                              </span>
                            ) : null}

                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/20' : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'}`}>
                              Directions <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>

                        </div>
                      </div>

                      {isSelected && isConfigured && !isUnavailable && (
                        <div className="mt-4 pt-4 border-t border-dashed border-current border-opacity-20 animate-in fade-in slide-in-from-top-2 duration-300">
                          <button onClick={() => setStep(3)} className={`hidden lg:flex w-full items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all ${isDark ? "bg-white text-black hover:bg-gray-200" : "bg-stone-900 text-white hover:bg-black"}`}>
                            Proceed to Checkout <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {sortedShops.length === 0 && (
                  <div className={`p-10 text-center border rounded-3xl ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}>
                    <Store className={`w-12 h-12 mx-auto mb-4 opacity-50 ${isDark ? 'text-white/50' : 'text-stone-400'}`} />
                    <p className="font-bold tracking-widest uppercase text-sm">No shops found</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Try adjusting your filters.</p>
                  </div>
                )}
              </div>

              {/* RIGHT: The Interactive Map */}
              <div className={`lg:col-span-7 rounded-[2rem] overflow-hidden border shadow-inner relative h-[300px] lg:h-full shrink-0 ${isDark ? "border-white/10" : "border-stone-200"}`}>
                <ShopDisplayMap
                  userLat={userLocation?.lat}
                  userLng={userLocation?.lng}
                  shops={shops as Shop[]}
                  selectedShopId={selectedShopId}
                  onShopSelect={(id) => {
                    const shop = shops.find(s => s.id === id);
                    const isClosed = shop?.is_active === false || shop?.is_active === null;
                    const isPaused = shop?.paused_until && new Date(shop?.paused_until) > new Date();
                    if (shop?.pricing && !isClosed && !isPaused) setSelectedShopId(id);
                  }}
                  isDark={isDark}
                />
              </div>
            </div>

            <div className="lg:hidden fixed bottom-24 left-0 right-0 px-6 z-50">
              <button onClick={() => setStep(3)} disabled={!selectedShopId} className={`w-full py-4 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl disabled:opacity-0 disabled:translate-y-10 ${isDark ? "bg-white text-black" : "bg-stone-900 text-white"}`}>
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CHECKOUT (UPDATED RECEIPT) ================= */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 max-w-2xl mx-auto">
            <div className="flex justify-between items-end mb-8 px-2">
              <h2 className="text-4xl font-black tracking-tight">Final Review</h2>
              <button onClick={() => setStep(2)} className={`font-bold text-xs uppercase tracking-widest border-b hidden sm:block transition-all ${isDark ? "border-white/50 hover:border-white" : "border-stone-400 hover:border-stone-900"}`}>← Back</button>
            </div>

            <div className={`border rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-xl transition-all duration-500 ${isDark ? "bg-[#111111]/80 border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5" : "bg-white border-stone-200/60 shadow-xl shadow-stone-200/40"}`}>
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-dashed border-current border-opacity-20">
                <div className={`w-16 h-16 rounded-2xl overflow-hidden border shrink-0 ${isDark ? 'border-white/10' : 'border-stone-200'}`}>
                  {shops.find((s) => s.id === selectedShopId)?.profile_pic ? (
                    <img src={shops.find((s) => s.id === selectedShopId)!.profile_pic!} alt="Shop" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                      <Store className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-stone-300'}`} />
                    </div>
                  )}
                </div>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${isDark ? "text-white/50" : "text-stone-500"}`}>Destination</span>
                  <span className="font-black text-xl">{shops.find((s) => s.id === selectedShopId)?.name}</span>
                </div>
              </div>

              <div className="space-y-6 border-b border-dashed border-current border-opacity-20 pb-8 mb-8">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? "text-white/50" : "text-stone-500"}`}>Document</span>
                  <span className="font-bold text-sm max-w-[50%] truncate">{file?.name}</span>
                </div>

                {/* NEW: DYNAMIC RECEIPT BREAKDOWN WITH EXACT RUPEES */}
                {(() => {
                  const breakdown = getPriceBreakdown(shops.find((s) => s.id === selectedShopId));
                  if (!breakdown) return null;

                  const isDiscount = breakdown.doubleSidedDifference < 0;
                  const diffAmount = Math.abs(breakdown.doubleSidedDifference).toFixed(2);

                  return (
                    <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Price Breakdown (Per Copy)</p>

                      {breakdown.colorCount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className={isDark ? "text-white/70" : "text-stone-600"}>{breakdown.colorCount}x Color Pages @ ₹{breakdown.colorPrice}</span>
                          <span className="font-bold">₹{(breakdown.colorCount * breakdown.colorPrice).toFixed(2)}</span>
                        </div>
                      )}

                      {breakdown.bwCount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className={isDark ? "text-white/70" : "text-stone-600"}>{breakdown.bwCount}x B&W Pages @ ₹{breakdown.bwPrice}</span>
                          <span className="font-bold">₹{(breakdown.bwCount * breakdown.bwPrice).toFixed(2)}</span>
                        </div>
                      )}

                      {breakdown.doubleCount > 0 && breakdown.doubleSidedDifference !== 0 && (
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-current border-opacity-20">
                          <span className={isDiscount ? (isDark ? "text-green-400/80" : "text-green-600/80") : (isDark ? "text-indigo-400/80" : "text-indigo-600/80")}>
                            Double-Sided {isDiscount ? 'Discount' : 'Charge'} ({breakdown.doubleCount} pg)
                          </span>
                          <span className={`font-bold ${isDiscount ? (isDark ? "text-green-400" : "text-green-600") : (isDark ? "text-indigo-400" : "text-indigo-600")}`}>
                            {isDiscount ? '-' : '+'}₹{diffAmount}
                          </span>
                        </div>
                      )}

                      {printConfig.copies > 1 && (
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-current border-opacity-10 font-bold">
                          <span>Total for 1 Copy</span>
                          <span>₹{breakdown.finalTotalForOneCopy.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? "text-white/50" : "text-stone-500"}`}>Total Due</p>
                  <p className="text-5xl font-black tracking-tighter">₹{getExactShopPrice(shops.find((s) => s.id === selectedShopId))}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? "bg-white/10" : "bg-stone-100"}`}>
                  <CreditCard className={`w-5 h-5 ${isDark ? "text-white" : "text-stone-900"}`} />
                </div>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={uploading} className={`relative w-full py-6 rounded-[2rem] font-black text-xl tracking-widest uppercase transition-all duration-500 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${isDark ? "bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1" : "bg-stone-900 text-white hover:bg-black shadow-xl hover:-translate-y-1"}`}>
              <span className="relative z-10 flex items-center gap-3">
                {uploading ? <><Activity className="w-6 h-6 animate-spin" /> Processing...</> : "Confirm & Pay"}
              </span>
            </button>
          </div>
        )}

        {/* ================= STEP 4: SUCCESS ================= */}
        {step === 4 && (
          <div className="animate-in zoom-in-95 duration-700 max-w-lg mx-auto mt-12">
            <div className={`border rounded-[3rem] p-12 sm:p-16 text-center backdrop-blur-xl ${isDark ? "bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] ring-1 ring-white/5" : "bg-white border-stone-200 shadow-2xl shadow-stone-200/50"}`}>
              <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${isDark ? "bg-gradient-to-br from-green-400 to-green-600 text-black" : "bg-gradient-to-br from-green-500 to-green-700 text-white"}`}>
                <CheckCircle2 className="w-14 h-14 drop-shadow-md" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight">Success!</h2>
              <p className={`font-medium text-lg leading-relaxed mb-12 ${isDark ? "text-white/60" : "text-stone-500"}`}>Your document is securely on its way to the print shop.</p>
              <button onClick={() => window.location.reload()} className={`w-full py-5 rounded-[2rem] font-black tracking-widest uppercase transition-all duration-300 border ${isDark ? "border-white/20 hover:bg-white/10 text-white hover:border-white/40" : "border-stone-300 hover:bg-stone-50 text-stone-900 hover:border-stone-400"}`}>
                Print Another Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}