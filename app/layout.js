import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "anzaar Order Engine | Premium Abaya Management",
  description: "Advanced order management system for luxury fashion brands.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto bg-gray-50/50">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
