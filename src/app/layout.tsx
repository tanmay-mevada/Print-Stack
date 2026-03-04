import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext"; // <-- Import the provider
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import AuthErrorCatcher from '@/components/AuthErrorCatcher'
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PrintStack | Smart Print Shop Management",
  description: "Join the paperless revolution and skip the printing queues forever.",
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/logo.png',
        href: '/logo.png',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/logo-white.png',
        href: '/logo-white.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Analytics/>
        <SpeedInsights/>
        <Toaster position="top-center" />
        <AuthErrorCatcher />
        {/* Wrap children in the ThemeProvider */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}