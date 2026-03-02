"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Zap,
  ShieldCheck,
  ArrowRight,
  FileText,
  CreditCard,
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
  Moon,
  Github,
  ArrowUp,
  
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

export default function Home() {
  // Theme state: defaults to dark mode
  const { isDark, toggleTheme } = useTheme();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-500 ${isDark ? "bg-[#0A0A0A] text-white selection:bg-white/30 selection:text-white" : "bg-[#faf9f6] text-stone-900 selection:bg-black/20 selection:text-black"}`}
    >
      {/* ================= NAVIGATION ================= */}
      <nav
        className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-500 ${
          isDark
            ? "bg-[#0A0A0A]/80 border-white/10"
            : "bg-[#faf9f6]/80 border-black/10"
        }`}
      >
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          {/* ================= LOGO ================= */}
          <a href="#home" className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <img
                src={isDark ? "/pblackx.png" : "/pwhitex.png"}
                alt="PrintStack Logo"
                className="w-9 h-9 object-contain"
              />
            </div>
            <span
              className={`font-bold text-xl tracking-tight transition-colors ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              PrintStack
            </span>
          </a>

          {/* ================= NAV LINKS ================= */}
          <div
            className={`hidden md:flex gap-8 font-semibold text-sm transition-colors ${
              isDark ? "text-white/50" : "text-stone-500"
            }`}
          >
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Features", href: "#features" },
              { label: "Tech Stack", href: "#tech-stack" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-colors duration-200 ${
                  isDark ? "hover:text-white" : "hover:text-stone-900"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* ================= RIGHT SIDE ================= */}
          {/* ================= RIGHT SIDE ================= */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle (Always Visible) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-300 ${
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-black/5 hover:bg-black/10 text-stone-900"
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Auth Buttons (Desktop Only) */}
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login">
                <span
                  className={`text-sm font-bold transition-colors ${
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Log in
                </span>
              </Link>

              <Link href="/signup">
                <span
                  className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
                    isDark
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-stone-900 text-white hover:bg-stone-800"
                  }`}
                >
                  Sign up
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MONOCHROME POLYMORPHIC HERO ================= */}
      <section
        className={`relative w-full min-h-screen lg:min-h-[85vh] flex flex-col items-center justify-center overflow-hidden pt-28 lg:pt-24 pb-20 lg:pb-12 transition-colors duration-500 ${isDark ? "bg-[#0A0A0A]" : "bg-[#faf9f6]"}`}
      >
        {/* Soft radial light */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${isDark ? "bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_60%)]" : "bg-[radial-gradient(circle_at_50%_40%,rgba(0,0,0,0.05),transparent_60%)]"}`}
        ></div>

        {/* Floating Card 1 */}
        <div
          className={`hidden lg:block absolute top-[25%] left-[8%] xl:left-[12%] backdrop-blur-xl border p-6 rounded-3xl w-72 -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 ${isDark ? "bg-[#111111]/80 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]" : "bg-white/80 border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.1)]"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
            >
              <FileText
                className={`w-7 h-7 transition-colors ${isDark ? "text-white" : "text-stone-900"}`}
              />
            </div>
            <div>
              <p
                className={`text-base font-bold truncate transition-colors ${isDark ? "text-white" : "text-stone-900"}`}
              >
                Project_Thesis.pdf
              </p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2
                  className={`w-4 h-4 transition-colors ${isDark ? "text-white" : "text-stone-900"}`}
                />
                <p
                  className={`text-xs uppercase tracking-wider transition-colors ${isDark ? "text-white/60" : "text-stone-500"}`}
                >
                  Ready
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating OTP Card */}
        <div
          className={`hidden lg:block absolute bottom-[15%] right-[8%] xl:right-[12%] backdrop-blur-xl p-8 rounded-[2.5rem] w-64 rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-500 border ${isDark ? "bg-[#111111]/90 border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.9)] text-white" : "bg-stone-900/90 border-stone-800 shadow-[0_30px_80px_rgba(0,0,0,0.2)] text-white"}`}
        >
          <div className="flex justify-between items-center mb-5">
            <p
              className={`text-xs uppercase tracking-widest font-bold transition-colors ${isDark ? "text-white/50" : "text-white/60"}`}
            >
              Secure OTP
            </p>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-5xl font-black tracking-tight text-white">
            392-817
          </p>
          <p
            className={`text-sm mt-2 transition-colors ${isDark ? "text-white/50" : "text-white/60"}`}
          >
            Reveal at counter
          </p>
        </div>

        {/* Floating Payment Chip */}
        <div
          className={`hidden lg:flex absolute top-[35%] right-[16%] xl:right-[20%] border px-6 py-4 rounded-full items-center gap-3 hover:scale-110 transition-all duration-400 ${isDark ? "bg-[#1A1A1A] border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)]" : "bg-white border-black/10 shadow-[0_15px_40px_rgba(0,0,0,0.1)]"}`}
        >
          <MousePointer2
            className={`w-5 h-5 transition-colors ${isDark ? "text-white" : "text-stone-900"}`}
          />
          <span
            className={`text-sm font-semibold transition-colors ${isDark ? "text-white/80" : "text-stone-800"}`}
          >
            Instant Payment
          </span>
        </div>

        {/* Core Content */}
        <div className="relative z-10 text-center px-4 lg:px-6 max-w-5xl">
          {/* FIX: Kept mb-14 for mobile, reduced to lg:mb-10 for desktop */}
          <div
            className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border text-xs font-black uppercase tracking-widest mb-14 lg:mb-10 backdrop-blur-lg shadow-sm transition-colors duration-500 ${isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-black/5 border-black/10 text-stone-600"}`}
          >
            <Sparkles className="w-4 h-4" />
            CVM Hackathon 2026 • PS: 227
          </div>

          {/* FIX: Kept text-4xl for mobile, reduced desktop from 13rem to 10rem/11.5rem to fit better */}
          <h1
            className={`text-4xl lg:text-[10rem] xl:text-[11.5rem] leading-[0.85] font-black tracking-[-0.06em] transition-colors duration-500 lg:tracking-tight tracking-widest ${isDark ? "text-white" : "text-stone-900"}`}
          >
            QUEUE-FREE
            <br />
            <span
              className={`lg:mt-0 mt-3 block ${isDark ? "text-white/40" : "text-black/20"}`}
            >
              PRINTING
            </span>
          </h1>

          {/* FIX: Kept mt-6 for mobile, reduced desktop from lg:mt-10 to lg:mt-8 */}
          <p
            className={`mt-6 md:mt-8 lg:mt-8 lg:text-xl sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed transition-colors duration-500 ${isDark ? "text-white/60" : "text-stone-600"}`}
          >
            Upload once. Compare prices. Pay instantly. Pick up securely. No
            noise. No chaos.
          </p>

          {/* FIX: Kept mt-10 for mobile, reduced desktop from lg:mt-14 to lg:mt-10 */}
          <div className="mt-10 lg:mt-10 flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link
              href="https://github.com/Aum-Ghodasara/PrintStack"
              target="_blank"
            >
              <button
                className={`hidden w-auto lg:px-12 px-8 py-4 lg:py-5 font-black rounded-xl lg:rounded-2xl text-md lg:text-lg hover:scale-105 transition-all duration-300 lg:flex items-center justify-center gap-2 whitespace-nowrap
                          ${
                            isDark
                              ? "bg-white text-black hover:shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
                              : "bg-stone-900 text-white hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                          }`}
              >
                Explore More<ArrowRight className="w-5 h-5" />
              </button>
              {/* Mobile Auth Buttons (Completely Unchanged) */}
              <div className="flex sm:hidden gap-3 mt-4">
                <Link href="/login">
                  <button
                    className={`px-6 py-2.5 text-lg font-bold rounded-full transition-all duration-300 ${
                      isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-black/5 text-stone-900 hover:bg-black/10"
                    }`}
                  >
                    Log in
                  </button>
                </Link>

                <Link href="/signup">
                  <button
                    className={`px-6 py-2.5 text-md font-bold rounded-full transition-all duration-300 ${
                      isDark
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    Sign up
                  </button>
                </Link>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className={`py-20 md:py-32 px-5 md:px-6 border-y relative z-10 transition-colors duration-500 ${
          isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-black/10"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-14 md:mb-24 space-y-3 md:space-y-4">
            <h2
              className={`text-3xl sm:text-4xl md:text-6xl font-black tracking-tight transition-colors duration-500 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              Digital Workflow
            </h2>
            <p
              className={`max-w-xl md:max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium transition-colors duration-500 ${
                isDark ? "text-white/60" : "text-stone-600"
              }`}
            >
              We solve manual printing delays. Upload, pay online, and skip the
              queue entirely.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "01",
                title: "Upload & Detect",
                desc: "Upload assignments or reports. Auto page detection instantly calculates your exact price.",
                icon: Upload,
              },
              {
                step: "02",
                title: "Compare & Pay",
                desc: "Compare nearby shop availability. Make a secure, cashless payment via Razorpay.",
                icon: CreditCard,
              },
              {
                step: "03",
                title: "Secure Pickup",
                desc: "Provide your OTP at the shop. Collect your printed documents without waiting in line.",
                icon: ShieldCheck,
              },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Step Number */}
                <div
                  className={`text-6xl md:text-8xl font-black absolute -top-6 md:-top-10 -left-4 md:-left-6 select-none z-20 transition-colors duration-500 ${
                    isDark
                      ? "text-white/5 group-hover:text-white/10"
                      : "text-black/5 group-hover:text-black/10"
                  }`}
                >
                  {item.step}
                </div>

                {/* Card */}
                <div
                  className={`relative rounded-2xl md:rounded-3xl p-6 md:p-10 h-full border hover:-translate-y-2 transition-all duration-500 ${
                    isDark
                      ? "bg-[#111111] border-white/10 hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                      : "bg-[#faf9f6] border-black/5 hover:border-black/20 hover:shadow-[0_0_40px_rgba(0,0,0,0.05)]"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 border rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-all duration-500 ${
                      isDark
                        ? "bg-white/5 border-white/10 group-hover:bg-white"
                        : "bg-black/5 border-black/10 group-hover:bg-stone-900"
                    }`}
                  >
                    <item.icon
                      className={`w-6 h-6 md:w-8 md:h-8 transition-colors ${
                        isDark
                          ? "text-white group-hover:text-black"
                          : "text-stone-900 group-hover:text-white"
                      }`}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 transition-colors ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-sm md:text-base font-medium leading-relaxed transition-colors ${
                      isDark ? "text-white/60" : "text-stone-600"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section
        id="features"
        className={`py-16 md:py-20 px-5 md:px-6 transition-colors duration-500 ${
          isDark ? "bg-[#0A0A0A]" : "bg-[#faf9f6]"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
            {/* Large Feature - Shop Ecosystem */}
            <div
              className={`md:col-span-8 group rounded-2xl md:rounded-3xl p-6 md:p-8 border transition-all duration-500 overflow-hidden relative flex flex-col ${
                isDark
                  ? "bg-[#111111] border-white/10 hover:border-white/30"
                  : "bg-white border-black/10 hover:border-black/30"
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700 ${
                  isDark ? "bg-white/5" : "bg-black/5"
                }`}
              />

              {/* FIX: Drastically reduced min-h from 360px to 240px */}
              <div className="h-full flex flex-col justify-between min-h-[180px] md:min-h-[240px]">
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 border rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${
                    isDark
                      ? "bg-white/10 border-white/10 group-hover:bg-white"
                      : "bg-black/5 border-black/10 group-hover:bg-stone-900"
                  }`}
                >
                  <Store
                    className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${
                      isDark
                        ? "text-white group-hover:text-black"
                        : "text-stone-900 group-hover:text-white"
                    }`}
                  />
                </div>

                <div className="mt-6 md:mt-8">
                  <h3
                    className={`text-2xl md:text-3xl font-black tracking-tight mb-2 transition-colors ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  >
                    Multi-Shop Ecosystem
                  </h3>
                  <p
                    className={`text-sm md:text-base font-medium leading-relaxed max-w-lg transition-colors ${
                      isDark ? "text-white/60" : "text-stone-600"
                    }`}
                  >
                    Students can browse nearby print shops, check their
                    real-time operational status, and compare pricing.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div
              className={`md:col-span-4 group rounded-2xl md:rounded-3xl p-6 md:p-8 text-white border relative overflow-hidden transition-colors duration-500 flex flex-col ${
                isDark
                  ? "bg-[#1A1A1A] border-white/10"
                  : "bg-stone-900 border-stone-800"
              }`}
            >
              <div
                className={`absolute -top-16 md:-top-20 -right-16 md:-right-20 w-40 md:w-64 h-40 md:h-64 rounded-full blur-3xl ${
                  isDark ? "bg-white/5" : "bg-white/10"
                }`}
              />

              <div className="relative z-10 h-full flex flex-col justify-between min-h-[180px] md:min-h-[240px]">
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 border rounded-xl md:rounded-2xl flex items-center justify-center ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-white/10 border-white/20"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>

                <div className="mt-6 md:mt-8">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white">
                    Secure Handover
                  </h3>
                  <p
                    className={`text-sm font-medium leading-relaxed ${
                      isDark ? "text-white/60" : "text-stone-300"
                    }`}
                  >
                    OTP-based verification guarantees secure document handover.
                  </p>
                </div>
              </div>
            </div>

            {/* Shop Analytics */}
            <div
              className={`md:col-span-4 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:scale-[1.02] transition-all duration-500 border flex flex-col ${
                isDark
                  ? "bg-white text-black border-transparent"
                  : "bg-stone-900 text-white border-stone-800"
              }`}
            >
              {/* FIX: Reduced min-h to 220px to keep bottom row compact */}
              <div className="h-full flex flex-col justify-between min-h-[200px] md:min-h-[220px]">
                <div>
                  <Layers
                    className={`w-8 md:w-10 h-8 md:h-10 mb-4 ${
                      isDark ? "text-black/80" : "text-white/80"
                    }`}
                  />
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                    Shop Analytics
                  </h3>
                  <p className="text-sm font-bold tracking-wide opacity-70">
                    Real-time tracking
                  </p>
                </div>

                <div className="mt-5 pt-5 border-t border-black/10">
                  <p className="text-xs md:text-sm font-semibold leading-relaxed opacity-70">
                    Daily revenue insights and digital workflow management.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Card (Bulk Orders) */}
            <div
              className={`md:col-span-8 group rounded-2xl md:rounded-3xl p-6 md:p-8 border transition-all duration-500 cursor-pointer flex flex-col ${
                isDark
                  ? "bg-[#111111] border-white/10 hover:bg-white"
                  : "bg-white border-black/10 hover:bg-stone-900"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full min-h-[200px] md:min-h-[220px]">
                <div className="space-y-2 md:space-y-3 max-w-xl">
                  <h3
                    className={`text-2xl md:text-3xl font-black tracking-tight transition-colors ${
                      isDark
                        ? "text-white group-hover:text-black"
                        : "text-stone-900 group-hover:text-white"
                    }`}
                  >
                    Bulk & Urgent Orders
                  </h3>
                  <p
                    className={`text-sm md:text-base font-medium transition-colors ${
                      isDark
                        ? "text-white/60 group-hover:text-black/60"
                        : "text-stone-600 group-hover:text-white/60"
                    }`}
                  >
                    Manage peak loads efficiently for thesis and lab records.
                  </p>

                  {/* Mobile Description */}
                  <div className="md:hidden mt-3">
                    <p
                      className={`text-sm font-medium leading-relaxed ${
                        isDark
                          ? "text-white/60 group-hover:text-black/60"
                          : "text-stone-600 group-hover:text-white/60"
                      }`}
                    >
                      Manage high-volume academic printing with streamlined
                      digital workflow and priority handling.
                    </p>
                  </div>
                </div>

                {/* Desktop Arrow */}
                <div
                  className={`hidden md:flex w-16 h-16 border rounded-full items-center justify-center transition-all duration-500 shrink-0 ${
                    isDark
                      ? "bg-white/10 border-white/20 group-hover:bg-black"
                      : "bg-black/5 border-black/10 group-hover:bg-white"
                  }`}
                >
                  <ChevronRight
                    className={`w-8 h-8 transition-colors ${
                      isDark ? "text-white" : "text-stone-900"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        className={`py-20 md:py-24 px-5 md:px-6 border-t transition-colors duration-500 ${
          isDark
            ? "bg-[#0A0A0A] border-white/10"
            : "bg-[#faf9f6] border-black/10"
        }`}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p
            className={`font-bold uppercase tracking-widest text-xs md:text-sm mb-10 md:mb-12 transition-colors ${
              isDark ? "text-white/40" : "text-stone-400"
            }`}
          >
            Powered By Modern Tech Stack
          </p>

          {/* Responsive Layout */}
          <div
            className="
        grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-6
        md:flex md:flex-wrap md:justify-center md:gap-x-16 md:gap-y-12
        items-center transition-opacity duration-700
      "
          >
            {/* Next.js */}
            <div className="flex flex-col items-center justify-center text-center min-w-[110px]">
              <Code2
                className={`w-7 h-7 md:w-8 md:h-8 ${
                  isDark ? "text-white" : "text-stone-800"
                }`}
              />
              <span
                className={`font-bold text-sm md:text-base mt-2 ${
                  isDark ? "text-white/80" : "text-stone-700"
                }`}
              >
                Next.js
              </span>
            </div>

            {/* Flutter */}
            <div className="flex flex-col items-center justify-center text-center min-w-[110px]">
              <Smartphone
                className={`w-7 h-7 md:w-8 md:h-8 ${
                  isDark ? "text-white" : "text-stone-800"
                }`}
              />
              <span
                className={`font-bold text-sm md:text-base mt-2 ${
                  isDark ? "text-white/80" : "text-stone-700"
                }`}
              >
                Flutter
              </span>
            </div>

            {/* Supabase */}
            <div className="flex flex-col items-center justify-center text-center min-w-[110px]">
              <Database
                className={`w-7 h-7 md:w-8 md:h-8 ${
                  isDark ? "text-white" : "text-stone-800"
                }`}
              />
              <span
                className={`font-bold text-sm md:text-base mt-2 ${
                  isDark ? "text-white/80" : "text-stone-700"
                }`}
              >
                Supabase
              </span>
            </div>

           <div className="flex flex-col items-center gap-3"> <CreditCard className={`w-8 h-8 ${isDark ? "text-white" : "text-stone-800"}`} />{" "} <span className={`font-bold ${isDark ? "text-white/80" : "text-stone-700"}`}> Razorpay </span> </div>

            {/* Tailwind */}
            <div className="flex flex-col items-center justify-center text-center min-w-[110px]">
              <Zap
                className={`w-7 h-7 md:w-8 md:h-8 ${
                  isDark ? "text-white" : "text-stone-800"
                }`}
              />
              <span
                className={`font-bold text-sm md:text-base mt-2 ${
                  isDark ? "text-white/80" : "text-stone-700"
                }`}
              >
                TailwindCSS
              </span>
            </div>

            {/* Vertex AI */}
            <div className="flex flex-col items-center justify-center text-center min-w-[110px]">
              <Sparkles
                className={`w-7 h-7 md:w-8 md:h-8 ${
                  isDark ? "text-white" : "text-stone-800"
                }`}
              />
              <span
                className={`font-bold text-sm md:text-base mt-2 ${
                  isDark ? "text-white/80" : "text-stone-700"
                }`}
              >
                Vertex AI
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* ================= FOOTER ================= */}
      <footer
        className={`py-16 px-6 border-t transition-colors duration-500 ${
          isDark
            ? "bg-[#050505] border-white/10 text-white/60"
            : "bg-[#faf9f6] border-black/10 text-stone-600"
        }`}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
          {/* Logo + Description */}
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src={isDark ? "/pblackx.png" : "/pwhitex.png"}
                alt="PrintStack Logo"
                className="w-7 h-7 object-contain"
              />
              <span
                className={`font-black tracking-tight text-2xl ${
                  isDark ? "text-white" : "text-stone-900"
                }`}
              >
                PrintStack
              </span>
            </div>

            <p
              className={`text-base font-medium leading-relaxed max-w-sm ${
                isDark ? "text-white/60" : "text-stone-600"
              }`}
            >
              Developed by{" "}
              <strong className={isDark ? "text-white" : "text-stone-900"}>
                Team TurboC++
              </strong>{" "}
              for the CVM Hackathon 2026. A secure and scalable architecture
              designed to eliminate daily printing queues.
            </p>
          </div>

          {/* Team */}
          <div>
            <h4
              className={`font-bold tracking-wide uppercase text-sm mb-6 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              Team TurboC++
            </h4>
            <ul
              className={`space-y-3 text-sm font-medium ${
                isDark ? "text-white/60" : "text-stone-600"
              }`}
            >
              <li>Aum Ghodasara (Leader)</li>
              <li>Tanmay Mevada</li>
              <li>Urvi Ladhani</li>
              <li>Archie Patel</li>
            </ul>
          </div>

          {/* Advisory */}
          <div>
            <h4
              className={`font-bold tracking-wide uppercase text-sm mb-6 ${
                isDark ? "text-white" : "text-stone-900"
              }`}
            >
              Advisory
            </h4>
            <ul
              className={`space-y-3 text-sm font-medium ${
                isDark ? "text-white/60" : "text-stone-600"
              }`}
            >
              <li>Mentor: Mosin Ibrahim Hasan</li>
              <li>Birla Vishvakarma Mahavidyalaya</li>
              <li>AI/ML Domain</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`max-w-7xl mx-auto pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 text-xs md:text-sm font-medium ${
            isDark ? "border-white/10" : "border-black/10"
          }`}
        >
          <p className="text-center md:text-left opacity-70">
            © 2026 PrintStack • Built for Innovation in Engineering &
            Technology.
          </p>

          <Link
            href="https://github.com/Aum-Ghodasara/PrintStack"
            target="_blank"
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
              isDark
                ? "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                : "bg-black/5 hover:bg-black/10 text-stone-700 hover:text-stone-900"
            }`}
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">View Source on GitHub</span>
            <span className="sm:hidden">GitHub Repo</span>
          </Link>
        </div>
      </footer>
      {showTop && (
        <button
          onClick={scrollToTop}
          className={`
      fixed bottom-6 left-1/2 -translate-x-1/2 
      md:left-auto md:translate-x-0 md:right-6 
      z-50 transition-all duration-300 hover:scale-110
      
      p-0 md:p-3
      bg-transparent md:rounded-full
      ${
        isDark
          ? "text-white md:bg-white md:text-black md:hover:bg-gray-200"
          : "text-stone-900 md:bg-stone-900 md:text-white md:hover:bg-stone-800"
      }
    `}
        >
          <ArrowUp className="w-7 h-7 md:w-5 md:h-5" />
        </button>
      )}
    </div>
  );
}
