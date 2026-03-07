"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { LocaleCode } from "@/config/locales";
import { DEFAULT_LOCALE, LOCALE_COOKIE } from "@/config/locales";

interface LocaleContextType {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  isReady: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  isReady: false,
});

function getLocaleFromCookie(): LocaleCode {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(^| )${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[2] as LocaleCode | undefined;
  const validCodes = ["en", "hi", "gu", "pa", "ml", "ta", "te", "bn", "mr", "kn"];
  return value && validCodes.includes(value) ? value : DEFAULT_LOCALE;
}

function setLocaleCookie(code: LocaleCode) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setLocaleState(getLocaleFromCookie());
    setIsReady(true);
  }, []);

  const setLocale = (code: LocaleCode) => {
    setLocaleState(code);
    setLocaleCookie(code);
    document.documentElement.lang = code;
  };

  useEffect(() => {
    if (isReady) document.documentElement.lang = locale;
  }, [locale, isReady]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isReady }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
