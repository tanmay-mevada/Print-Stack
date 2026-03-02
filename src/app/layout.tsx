import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext"; // <-- Import the provider

export const metadata: Metadata = {
  title: "PrintStack++ | Smart Print Shop Management",
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
        {/* Wrap children in the ThemeProvider */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}