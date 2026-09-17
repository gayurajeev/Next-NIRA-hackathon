import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "NIRA - Intelligent Civic Drainage Reporting & Response System (Keralam)",
  description: "Intelligent civic drainage reporting, AI issue classification, ward-level dispatch, and flood hotspot detection for Keralam Municipal Corporation.",
  keywords: ["NIRA", "Civic Tech", "Keralam Drainage", "Fund My Crazy", "Keralam Municipal Corporation", "Storm Drain", "Hotspot Detection"],
  icons: {
    icon: "/nira-logo.png",
    shortcut: "/nira-logo.png",
    apple: "/nira-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased bg-[#EDF4FF] text-slate-900 min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
