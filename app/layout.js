import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "../components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata = {
  title: "anzaar Order Engine | Premium Abaya Management",
  description: "Advanced order management system for luxury fashion brands.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} bg-gray-50 dark:bg-emerald-950 antialiased`}>
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto bg-gray-50/50 relative">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
