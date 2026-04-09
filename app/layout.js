import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import PWA from "../components/PWA";
import ConfigCheck from "../components/ConfigCheck";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata = {
  title: "anzaar Order Engine | Premium Abaya Management",
  description: "Advanced order management system for luxury fashion brands.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#022c22" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} bg-gray-50 dark:bg-emerald-950 antialiased`}>
        <ConfigCheck />
        <PWA />
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto bg-gray-50/50 relative">
            {children}
          </main>
        </div>
        <BottomNav />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
