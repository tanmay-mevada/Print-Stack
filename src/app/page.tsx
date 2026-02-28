"use client";

import { useState } from "react";
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
  CheckCircle2,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  // Theme state: defaults to dark mode
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] text-white selection:bg-white/30 selection:text-white' : 'bg-[#faf9f6] text-stone-900 selection:bg-black/20 selection:text-black'}`}>
      
      {/* ================= NAVIGATION ================= */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A]/80 border-white/10' : 'bg-[#faf9f6]/80 border-black/10'}`}>
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm transition-colors ${isDark ? 'bg-white' : 'bg-stone-900'}`}>
              <Printer className={`w-5 h-5 ${isDark ? 'text-black' : 'text-white'}`} />
            </div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
              PrintStack++
            </span>
          </div>
          
          <div className={`hidden md:flex gap-8 font-semibold text-sm transition-colors ${isDark ? 'text-white/50' : 'text-stone-500'}`}>
            {['How it works', 'Multi-Shop', 'For Shopkeepers', 'Tech Stack'].map((item) => (
              <Link 
                key={item} 
                href="#" 
                className={`transition-colors duration-200 ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}
              >
                {item}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* --- THEME TOGGLE BUTTON --- */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-full transition-all duration-300 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-stone-900'}`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* --- AUTH BUTTONS --- */}
            <Link 
              href="/login" 
              className={`hidden sm:block text-sm font-bold transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className={`px-5 py-2.5 font-bold text-sm rounded-full transition-all duration-300 shadow-sm ${isDark ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= MONOCHROME POLYMORPHIC HERO ================= */}
      <section className={`relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-20 transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#faf9f6]'}`}>
        
        {/* Soft radial light */}
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_60%)]' : 'bg-[radial-gradient(circle_at_50%_40%,rgba(0,0,0,0.05),transparent_60%)]'}`}></div>

        {/* Floating Card 1 */}
        <div className={`hidden lg:block absolute top-[20%] left-[7%] backdrop-blur-xl border p-6 rounded-3xl w-72 -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 ${isDark ? 'bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' : 'bg-white/80 border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.1)]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
              <FileText className={`w-7 h-7 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`} />
            </div>
            <div>
              <p className={`text-base font-bold truncate transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Project_Thesis.pdf
              </p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className={`w-4 h-4 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`} />
                <p className={`text-xs uppercase tracking-wider transition-colors ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                  Ready
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating OTP Card */}
        <div className={`hidden lg:block absolute bottom-[22%] right-[8%] backdrop-blur-xl p-8 rounded-[2.5rem] w-64 rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-500 border ${isDark ? 'bg-[#111111]/90 border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.9)] text-white' : 'bg-stone-900/90 border-stone-800 shadow-[0_30px_80px_rgba(0,0,0,0.2)] text-white'}`}>
          <div className="flex justify-between items-center mb-5">
            <p className={`text-xs uppercase tracking-widest font-bold transition-colors ${isDark ? 'text-white/50' : 'text-white/60'}`}>
              Secure OTP
            </p>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-5xl font-black tracking-tight text-white">
            392-817
          </p>
          <p className={`text-sm mt-2 transition-colors ${isDark ? 'text-white/50' : 'text-white/60'}`}>
            Reveal at counter
          </p>
        </div>

        {/* Floating Payment Chip */}
        <div className={`hidden lg:flex absolute top-[38%] right-[14%] border px-6 py-4 rounded-full items-center gap-3 hover:scale-110 transition-all duration-400 ${isDark ? 'bg-[#1A1A1A] border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)]' : 'bg-white border-black/10 shadow-[0_15px_40px_rgba(0,0,0,0.1)]'}`}>
          <MousePointer2 className={`w-5 h-5 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`} />
          <span className={`text-sm font-semibold transition-colors ${isDark ? 'text-white/80' : 'text-stone-800'}`}>
            Instant Payment
          </span>
        </div>

        {/* Core Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border text-xs font-black uppercase tracking-widest mb-14 backdrop-blur-lg shadow-sm transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-black/5 border-black/10 text-stone-600'}`}>
            <Sparkles className="w-4 h-4" />
            CVM Hackathon 2026 • PS: 227
          </div>

          <h1 className={`text-[13vw] lg:text-[13rem] leading-[0.85] font-black tracking-[-0.06em] transition-colors duration-500 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            QUEUE-FREE
            <br />
            <span className={isDark ? 'text-white/40' : 'text-black/20'}>PRINTING</span>
          </h1>

          <p className={`mt-10 text-xl sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed transition-colors duration-500 ${isDark ? 'text-white/60' : 'text-stone-600'}`}>
            Upload once. Compare prices. Pay instantly.
            Pick up securely. No noise. No chaos.
          </p>

          <div className="mt-14 flex flex-col sm:flex-row justify-center gap-6">
            <Link href="https://github.com/Aum-Ghodasara/PrintStack" target="_blank">
              <button className={`w-full sm:w-auto px-12 py-5 font-black rounded-2xl text-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 ${isDark ? 'bg-white text-black hover:shadow-[0_20px_60px_rgba(255,255,255,0.2)]' : 'bg-stone-900 text-white hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]'}`}>
                Explore Prototype <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <button className={`w-full sm:w-auto px-12 py-5 border font-bold rounded-2xl text-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 ${isDark ? 'bg-transparent border-white/20 text-white hover:bg-white/10' : 'bg-transparent border-black/20 text-stone-900 hover:bg-black/5'}`}>
              <MapPin className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-stone-500'}`} /> Find Shops Near Me
            </button>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className={`py-32 px-6 border-y relative z-10 transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className={`text-4xl md:text-6xl font-black tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Digital Workflow
            </h2>
            <p className={`max-w-2xl mx-auto text-xl font-medium transition-colors duration-500 ${isDark ? 'text-white/60' : 'text-stone-600'}`}>
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
                <div className={`text-8xl font-black absolute -top-10 -left-6 select-none -z-10 transition-colors duration-500 ${isDark ? 'text-white/5 group-hover:text-white/10' : 'text-black/5 group-hover:text-black/10'}`}>
                  {item.step}
                </div>
                <div className={`relative rounded-3xl p-10 h-full border hover:-translate-y-2 transition-all duration-500 ${isDark ? 'bg-[#111111] border-white/10 hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]' : 'bg-[#faf9f6] border-black/5 hover:border-black/20 hover:shadow-[0_0_40px_rgba(0,0,0,0.05)]'}`}>
                  <div className={`w-16 h-16 border rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 ${isDark ? 'bg-white/5 border-white/10 group-hover:bg-white' : 'bg-black/5 border-black/10 group-hover:bg-stone-900'}`}>
                    <item.icon className={`w-8 h-8 transition-colors ${isDark ? 'text-white group-hover:text-black' : 'text-stone-900 group-hover:text-white'}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>{item.title}</h3>
                  <p className={`font-medium leading-relaxed transition-colors ${isDark ? 'text-white/60' : 'text-stone-600'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className={`py-32 px-6 transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#faf9f6]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Large Feature - Shop Ecosystem */}
            <div className={`md:col-span-8 group rounded-[2.5rem] p-12 border transition-all duration-500 overflow-hidden relative ${isDark ? 'bg-[#111111] border-white/10 hover:border-white/30' : 'bg-white border-black/10 hover:border-black/30'}`}>
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700 ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
              <div className="h-full flex flex-col justify-between min-h-[360px]">
                <div className={`w-16 h-16 border rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6 ${isDark ? 'bg-white/10 border-white/10 group-hover:bg-white' : 'bg-black/5 border-black/10 group-hover:bg-stone-900'}`}>
                  <Store className={`w-8 h-8 transition-colors ${isDark ? 'text-white group-hover:text-black' : 'text-stone-900 group-hover:text-white'}`} />
                </div>
                <div>
                  <h3 className={`text-4xl font-black tracking-tight mb-4 transition-colors ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    Multi-Shop Ecosystem
                  </h3>
                  <p className={`text-lg font-medium leading-relaxed max-w-lg transition-colors ${isDark ? 'text-white/60' : 'text-stone-600'}`}>
                    Students can browse nearby print shops, check their real-time operational status, and compare pricing. Enabling fair competition and better service quality for everyone.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className={`md:col-span-4 group rounded-[2.5rem] p-12 text-white border relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#1A1A1A] border-white/10' : 'bg-stone-900 border-stone-800'}`}>
              <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl transition-colors duration-500 ${isDark ? 'bg-white/5' : 'bg-white/10'}`} />
              <div className="relative z-10 h-full flex flex-col justify-between min-h-[360px]">
                <div className={`w-16 h-16 border rounded-3xl flex items-center justify-center backdrop-blur-md mb-6 transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'}`}>
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight mb-4 text-white">Secure Handover</h3>
                  <p className={`font-medium leading-relaxed transition-colors ${isDark ? 'text-white/60' : 'text-stone-300'}`}>
                    OTP-based verification guarantees that printed documents are handed over only to the rightful owner.
                  </p>
                </div>
              </div>
            </div>

            {/* Shopkeeper Dashboard Stats */}
            <div className={`md:col-span-4 rounded-[2.5rem] p-12 hover:scale-[1.02] transition-all duration-500 border ${isDark ? 'bg-white text-black border-transparent' : 'bg-stone-900 text-white border-stone-800'}`}>
              <div className="h-full flex flex-col justify-center">
                <Layers className={`w-12 h-12 mb-6 ${isDark ? 'text-black/80' : 'text-white/80'}`} />
                <h3 className="text-3xl font-black tracking-tight mb-2">Shop Analytics</h3>
                <p className={`text-lg font-bold tracking-wide ${isDark ? 'text-black/60' : 'text-white/60'}`}>Real-time tracking</p>
                <div className={`mt-8 pt-8 border-t ${isDark ? 'border-black/10' : 'border-white/10'}`}>
                  <p className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-black/70' : 'text-white/70'}`}>
                    Provides daily revenue insights, order volume tracking, and digital workflow management for shop owners.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className={`md:col-span-8 group rounded-[2.5rem] p-12 border transition-all duration-500 cursor-pointer ${isDark ? 'bg-[#111111] border-white/10 hover:bg-white' : 'bg-white border-black/10 hover:bg-stone-900'}`}>
              <div className="h-full flex items-center justify-between">
                <div className="space-y-4">
                  <h3 className={`text-4xl font-black tracking-tight transition-colors ${isDark ? 'text-white group-hover:text-black' : 'text-stone-900 group-hover:text-white'}`}>
                    Bulk & Urgent Orders
                  </h3>
                  <p className={`text-lg font-medium transition-colors ${isDark ? 'text-white/60 group-hover:text-black/60' : 'text-stone-600 group-hover:text-white/60'}`}>Manage peak loads efficiently for thesis, lab records, and event materials.</p>
                </div>
                <div className={`w-20 h-20 border rounded-full flex items-center justify-center transition-all duration-500 shrink-0 ml-4 shadow-sm ${isDark ? 'bg-white/10 border-white/20 group-hover:bg-black' : 'bg-black/5 border-black/10 group-hover:bg-white'}`}>
                  <ChevronRight className={`w-10 h-10 transition-colors ${isDark ? 'text-white group-hover:text-white' : 'text-stone-900 group-hover:text-stone-900'}`} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= TECH STACK ================= */}
      <section className={`py-24 px-6 border-t transition-colors duration-500 ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-[#faf9f6] border-black/10'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <p className={`font-bold uppercase tracking-widest text-sm mb-12 transition-colors ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Powered By Modern Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-x-16 gap-y-12 items-center opacity-50 hover:opacity-100 transition-opacity duration-700">
            <div className="flex flex-col items-center gap-3"><Code2 className={`w-8 h-8 ${isDark ? 'text-white' : 'text-stone-800'}`}/> <span className={`font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Next.js</span></div>
            <div className="flex flex-col items-center gap-3"><Smartphone className={`w-8 h-8 ${isDark ? 'text-white' : 'text-stone-800'}`}/> <span className={`font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Flutter</span></div>
            <div className="flex flex-col items-center gap-3"><Database className={`w-8 h-8 ${isDark ? 'text-white' : 'text-stone-800'}`}/> <span className={`font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Supabase</span></div>
            <div className="flex flex-col items-center gap-3"><CreditCard className={`w-8 h-8 ${isDark ? 'text-white' : 'text-stone-800'}`}/> <span className={`font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Razorpay</span></div>
            <div className="flex flex-col items-center gap-3"><Zap className={`w-8 h-8 ${isDark ? 'text-white' : 'text-stone-800'}`}/> <span className={`font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>TailwindCSS</span></div>
            <div className="flex flex-col items-center gap-3"><Sparkles className={`w-8 h-8 ${isDark ? 'text-white' : 'text-stone-800'}`}/> <span className={`font-bold ${isDark ? 'text-white/80' : 'text-stone-700'}`}>Vertex AI</span></div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className={`py-16 px-6 border-t transition-colors duration-500 ${isDark ? 'bg-[#050505] border-white/10 text-white/50' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3 text-white">
              <Printer className="w-6 h-6" />
              <span className="font-black tracking-tight text-2xl">PrintStack++</span>
            </div>
            <p className={`text-base font-medium leading-relaxed max-w-sm ${isDark ? 'text-white/60' : 'text-stone-400'}`}>
              Developed by <strong className="text-white">Team TurboC++</strong> for the CVM Hackathon 2026. 
              A win-win model offering a secure and scalable architecture to solve daily printing queues.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold tracking-wide uppercase text-xs mb-6">Team TurboC++</h4>
            <ul className={`space-y-3 font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-400'}`}>
              <li>Aum Ghodasara (Leader)</li>
              <li>Tanmay Mevada</li>
              <li>Urvi Ladhani</li>
              <li>Archie Patel</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold tracking-wide uppercase text-xs mb-6">Advisory</h4>
            <ul className={`space-y-3 font-medium text-sm ${isDark ? 'text-white/60' : 'text-stone-400'}`}>
              <li>Mentor: Mosin Ibrahim Hasan</li>
              <li>Birla Vishvakarma Mahavidyalaya</li>
              <li>AI/ML Domain</li>
            </ul>
          </div>
        </div>
        
        <div className={`max-w-7xl mx-auto pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium ${isDark ? 'border-white/10' : 'border-stone-800/50'}`}>
          <p>© 2026 PrintStack. Student Innovation • Engineering and Technology.</p>
          <div className="flex gap-6">
            <Link href="https://github.com/Aum-Ghodasara/PrintStack" target="_blank" className="hover:text-white transition-colors">GitHub Repository</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}