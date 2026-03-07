"use client";

import { NextIntlClientProvider } from "next-intl";
import { useLocale } from "@/context/LocaleContext";
import type { LocaleCode } from "@/config/locales";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";
import gu from "@/messages/gu.json";
import pa from "@/messages/pa.json";
import ml from "@/messages/ml.json";
import ta from "@/messages/ta.json";
import te from "@/messages/te.json";
import bn from "@/messages/bn.json";
import mr from "@/messages/mr.json";
import kn from "@/messages/kn.json";

const messages: Record<LocaleCode, typeof en> = {
  en,
  hi,
  gu,
  pa,
  ml,
  ta,
  te,
  bn,
  mr,
  kn,
};

export default function IntlLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, isReady } = useLocale();
  const activeLocale = isReady ? locale : "en";
  const localeMessages = messages[activeLocale as keyof typeof messages] ?? en;

  return (
    <NextIntlClientProvider locale={activeLocale} messages={localeMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
