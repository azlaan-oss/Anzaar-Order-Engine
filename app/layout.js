import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import PWA from "../components/PWA";
import ConfigCheck from "../components/ConfigCheck";
import { AuthProvider } from "../lib/auth-context";
import RouteGuard from "../components/RouteGuard";
import Header from "../components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata = {
  title: "anzaar Order Engine | Premium Abaya Management",
  description: "Enterprise-grade order management and strategic inventory system for Anzaar.",
  manifest: "/manifest.json",
  themeColor: "#064e3b",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} bg-gray-50 dark:bg-emerald-950 antialiased relative`}>
        <AuthProvider>
          <RouteGuard>
            <ConfigCheck />
            <PWA />
            <div className="min-h-screen flex flex-col md:flex-row w-full">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50 dark:bg-emerald-950/20 w-full overflow-x-hidden pt-20 md:pt-0">
                 <Header />
                 <main className="flex-1 p-4 md:p-8">
                   {children}
                 </main>
              </div>
            </div>
            <BottomNav />
          </RouteGuard>
        </AuthProvider>
        <Toaster position="top-right" expand={true} richColors />
      </body>
    </html>
  );
}
