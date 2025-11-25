import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PriceDiary",
  description: "Твоят личен дневник на цените",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
