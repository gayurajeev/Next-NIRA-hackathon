import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIRA - Intelligent Civic Drainage Reporting & Response System (Keralam)",
  description: "Intelligent civic drainage reporting, AI issue classification, ward-level dispatch, and flood hotspot detection for Keralam Municipal Corporation.",
  keywords: ["NIRA", "Civic Tech", "Keralam Drainage", "Fund My Crazy", "Keralam Municipal Corporation", "Storm Drain", "Hotspot Detection"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased bg-[#EDF4FF] text-slate-900">
        {children}
      </body>
    </html>
  );
}
