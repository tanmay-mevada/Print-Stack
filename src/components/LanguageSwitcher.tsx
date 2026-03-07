"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import { LOCALES } from "@/config/locales";

export default function LanguageSwitcher() {
  const { locale, setLocale, isReady } = useLocale();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isReady) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
          isDark
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-black/5 hover:bg-black/10 text-stone-900"
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm font-semibold hidden sm:inline truncate max-w-[80px]">
          {current.native}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto border rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 ${
            isDark
              ? "bg-[#111111] border-white/10 shadow-black"
              : "bg-white border-stone-200 shadow-stone-200/50"
          }`}
        >
          {LOCALES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={locale === lang.code}
              onClick={() => {
                setLocale(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                locale === lang.code
                  ? isDark
                    ? "bg-white/10 text-white"
                    : "bg-stone-100 text-stone-900"
                  : isDark
                    ? "text-white/80 hover:bg-white/5"
                    : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className="text-base font-medium">{lang.native}</span>
              <span
                className={`text-xs ${isDark ? "text-white/50" : "text-stone-400"}`}
              >
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
