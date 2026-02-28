"use client";

import {
  Upload,
  Zap,
  ShieldCheck,
  ArrowRight,
  FileText,
  CreditCard,
  Printer,
  ChevronRight,
  MousePointer2,
  Sparkles,
  Store,
  Layers,
  Code2,
  Database,
  Smartphone,
  MapPin,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-orange-200 selection:text-stone-900 font-sans">
      
      {/* ================= NAVIGATION ================= */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf9f6]/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-900 rounded-lg flex items-center justify-center shadow-sm">
              <Printer className="text-[#faf9f6] w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">
              PrintStack++
            </span>
          </div>
          
          <div className="hidden md:flex gap-8 font-semibold text-sm text-stone-500">
            {['How it works', 'Multi-Shop', 'For Shopkeepers', 'Tech Stack'].map((item) => (
              <Link 
                key={item} 
                href="#" 
                className="hover:text-stone-900 transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>
          
          {/* --- AUTH BUTTONS INTEGRATED HERE --- */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden sm:block text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 bg-orange-600 text-white font-bold text-sm rounded-full hover:bg-orange-700 transition-all duration-200 shadow-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= 100% STATIC HERO (3G OPTIMIZED) ================= */}
      <section className="relative w-full min-h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-[#faf9f6] pt-20">
        
        {/* Zero-Network Radial Background */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 100%)' }}></div>

        {/* --- STATIC UI ELEMENTS (Desktop Only) --- */}
        
        {/* 1. PDF Status Card (Locked with a slight -6deg tilt) */}
        <div className="hidden lg:flex absolute top-[20%] left-[8%] bg-white p-4 rounded-3xl shadow-xl border border-stone-200/60 items-center gap-4 z-10 w-[280px] -rotate-6">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-stone-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">Lab_Record_Final.pdf</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Printed</p>
            </div>
          </div>
        </div>

        {/* 2. OTP Security Card (Locked with a slight 3deg tilt) */}
        <div className="hidden lg:block absolute bottom-[22%] right-[8%] bg-stone-900 text-white p-6 rounded-3xl shadow-2xl z-10 w-[240px] rotate-3">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Secure Pickup</p>
            <ShieldCheck className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-4xl font-black tracking-tighter text-white mb-1">774-902</p>
          <p className="text-xs text-stone-400 font-medium">Show code to shopkeeper</p>
        </div>

        {/* 3. Floating Cursor / Razorpay Chip (Locked position) */}
        <div className="hidden lg:flex absolute top-[30%] right-[16%] bg-white/90 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-stone-200 items-center gap-3 z-10 translate-x-4 -translate-y-2">
          <MousePointer2 className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span className="text-sm font-bold text-stone-800">Paid via Razorpay</span>
        </div>

        {/* --- CORE TYPOGRAPHY & CTA --- */}
        <div className="relative z-10 text-center flex flex-col items-center w-full px-4 max-w-6xl mx-auto">
          
          <div className="flex flex-col items-center">
            {/* Minimal Badge */}
            <div className="px-4 py-1.5 rounded-full bg-white border border-stone-200 text-stone-600 text-[11px] font-black uppercase tracking-widest mb-10 inline-flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              CVM Hackathon 2026 • PS: 227
            </div>

            {/* Massive Brutalist Headline */}
            <h1 className="text-[14vw] lg:text-[160px] leading-[0.8] font-black tracking-tighter text-stone-900 uppercase">
              QUEUE-FREE
              <br />
              <span className="text-stone-300">PRINTING.</span>
            </h1>

            {/* Context Subtext */}
            <p className="mt-10 text-lg sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto leading-relaxed">
               Connect with local print shops instantly. Upload your documents, compare exact prices, pay securely, and collect your stack using a private OTP.
            </p>
          </div>

          {/* Glassmorphism CTA Dock */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-3 p-3 bg-white/60 backdrop-blur-2xl border border-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <Link href="https://github.com/Aum-Ghodasara/PrintStack" target="_blank" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-600/20 transition-all duration-300 flex items-center justify-center gap-2">
                View Prototype <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-stone-800 font-bold rounded-2xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2">
               <MapPin className="w-5 h-5 text-stone-400" /> Browse Nearby Shops
            </button>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-24 px-6 bg-white border-y border-stone-200 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900">
              Digital Workflow
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg font-medium">
              We solve manual printing delays. Upload, pay online, and skip the queue entirely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "01", 
                title: "Upload & Detect", 
                desc: "Upload assignments or reports. Auto page detection instantly calculates your exact price.",
                icon: Upload
              },
              { 
                step: "02", 
                title: "Compare & Pay", 
                desc: "Compare nearby shop availability. Make a secure, cashless payment via Razorpay.",
                icon: CreditCard
              },
              { 
                step: "03", 
                title: "Secure Pickup", 
                desc: "Provide your OTP at the shop. Collect your printed documents without waiting in line.",
                icon: ShieldCheck
              }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="text-8xl font-black text-stone-50 absolute -top-10 -left-6 select-none -z-10 group-hover:text-orange-50 transition-colors duration-500">
                  {item.step}
                </div>
                <div className="relative bg-white rounded-3xl p-8 h-full border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
                    <item.icon className="w-6 h-6 text-stone-900 group-hover:text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-3">{item.title}</h3>
                  <p className="text-stone-600 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="py-32 px-6 bg-[#faf9f6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Large Feature - Shop Ecosystem */}
            <div className="md:col-span-8 group bg-white rounded-[2.5rem] p-12 shadow-sm border border-stone-200 hover:shadow-xl transition-all duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700" />
              <div className="h-full flex flex-col justify-between min-h-[360px]">
                <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-orange-500 group-hover:rotate-6 transition-all duration-300">
                  <Store className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-4xl font-black tracking-tight text-stone-900 mb-4">
                    Multi-Shop Ecosystem
                  </h3>
                  <p className="text-stone-600 text-lg font-medium leading-relaxed max-w-lg">
                    Students can browse nearby print shops, check their real-time operational status, and compare pricing. Enabling fair competition and better service quality for everyone.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="md:col-span-4 group bg-stone-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
              <div className="relative z-10 h-full flex flex-col justify-between min-h-[360px]">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md mb-6">
                  <ShieldCheck className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight mb-4">Secure Handover</h3>
                  <p className="text-stone-400 font-medium leading-relaxed">
                    OTP-based verification guarantees that printed documents are handed over only to the rightful owner.
                  </p>
                </div>
              </div>
            </div>

            {/* Shopkeeper Dashboard Stats */}
            <div className="md:col-span-4 bg-orange-500 rounded-[2.5rem] p-12 text-white">
              <div className="h-full flex flex-col justify-center">
                <Layers className="w-12 h-12 text-orange-100 mb-6" />
                <h3 className="text-3xl font-black tracking-tight mb-2">Shop Analytics</h3>
                <p className="text-orange-100 text-lg font-semibold tracking-wide">Real-time tracking</p>
                <div className="mt-8 pt-8 border-t border-orange-400/30">
                  <p className="text-sm font-medium text-orange-100 leading-relaxed">
                    Provides daily revenue insights, order volume tracking, and digital workflow management for shop owners.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="md:col-span-8 group bg-stone-100 rounded-[2.5rem] p-12 border border-stone-200 hover:bg-stone-900 hover:text-white transition-all duration-500 cursor-pointer">
              <div className="h-full flex items-center justify-between">
                <div className="space-y-4">
                  <h3 className="text-4xl font-black tracking-tight text-stone-900 group-hover:text-white transition-colors">
                    Bulk & Urgent Orders
                  </h3>
                  <p className="text-stone-600 group-hover:text-stone-400 text-lg font-medium transition-colors">Manage peak loads efficiently for thesis, lab records, and event materials.</p>
                </div>
                <div className="w-20 h-20 bg-white group-hover:bg-orange-500 rounded-full flex items-center justify-center transition-all duration-500 shrink-0 ml-4 shadow-sm group-hover:shadow-orange-500/50">
                  <ChevronRight className="w-10 h-10 text-stone-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= TECH STACK ================= */}
      <section className="py-24 px-6 bg-white border-t border-stone-200">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-stone-400 font-bold uppercase tracking-widest text-sm mb-12">Powered By Modern Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-12 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="flex flex-col items-center gap-3"><Code2 className="w-8 h-8"/> <span className="font-bold text-stone-800">Next.js</span></div>
            <div className="flex flex-col items-center gap-3"><Smartphone className="w-8 h-8"/> <span className="font-bold text-stone-800">Flutter</span></div>
            <div className="flex flex-col items-center gap-3"><Database className="w-8 h-8"/> <span className="font-bold text-stone-800">Supabase</span></div>
            <div className="flex flex-col items-center gap-3"><CreditCard className="w-8 h-8"/> <span className="font-bold text-stone-800">Razorpay</span></div>
            <div className="flex flex-col items-center gap-3"><Zap className="w-8 h-8"/> <span className="font-bold text-stone-800">TailwindCSS</span></div>
            <div className="flex flex-col items-center gap-3"><Sparkles className="w-8 h-8"/> <span className="font-bold text-stone-800">Vertex AI</span></div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-16 px-6 bg-stone-950 text-stone-400">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3 text-white">
              <Printer className="w-6 h-6" />
              <span className="font-black tracking-tight text-2xl">PrintStack++</span>
            </div>
            <p className="text-base font-medium leading-relaxed max-w-sm">
              Developed by <strong className="text-white">Team TurboC++</strong> for the CVM Hackathon 2026. 
              A win-win model offering a secure and scalable architecture to solve daily printing queues.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold tracking-wide uppercase text-xs mb-6">Team TurboC++</h4>
            <ul className="space-y-3 font-medium text-sm">
              <li>Aum Ghodasara (Leader)</li>
              <li>Tanmay Mevada</li>
              <li>Urvi Ladhani</li>
              <li>Archie Patel</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold tracking-wide uppercase text-xs mb-6">Advisory</h4>
            <ul className="space-y-3 font-medium text-sm">
              <li>Mentor: Mosin Ibrahim Hasan</li>
              <li>Birla Vishvakarma Mahavidyalaya</li>
              <li>AI/ML Domain</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-stone-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium">
          <p>© 2026 PrintStack. Student Innovation • Engineering and Technology.</p>
          <div className="flex gap-6">
            <Link href="https://github.com/Aum-Ghodasara/PrintStack" target="_blank" className="hover:text-white transition-colors">GitHub Repository</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}