import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "PriceDiary",
  description: "Твоят личен дневник на цените",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

// 🔵 Преместен themeColor от metadata → viewport (както изисква Next.js)
export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <head>
        {/* Допълнителни линкове, които ти поиска */}
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>

      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          <div className="pt-4">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
