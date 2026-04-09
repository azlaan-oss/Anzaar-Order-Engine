"use client";

import React from 'react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, LogOut, Package, ClipboardList, FileSpreadsheet, Trash2, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'New Order', icon: PlusCircle, path: '/orders/new' },
  { name: 'Products', icon: Package, path: '/admin/products' },
  { name: 'All Orders', icon: ClipboardList, path: '/admin/orders' },
  { name: 'Spreadsheet', icon: FileSpreadsheet, path: '/admin/sheets' },
  { name: 'Reports', icon: ClipboardList, path: '/admin/reports' },
  { name: 'Trash', icon: Trash2, path: '/admin/trash' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(null);

  React.useEffect(() => {
    return onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data());
      }
    });
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-emerald-950 p-4 flex items-center justify-between sticky top-0 z-[60] border-b border-white/5">
         <div className="flex items-center justify-between">
            {settings?.logoUrl ? (
               <div className="flex flex-col items-start gap-0.5">
                  <div className="h-7 w-auto flex items-center justify-center overflow-visible">
                     <img 
                        src={settings.logoUrl} 
                        className="h-full w-auto object-contain brightness-150 scale-[1.2] origin-left ml-1" 
                        style={{ mixBlendMode: 'screen' }} 
                        alt="Brand Logo" 
                     />
                  </div>
                  <p className="text-[6px] uppercase tracking-[0.4em] text-white/20 leading-none pl-1 mt-1">Order Engine</p>
               </div>
            ) : (
               <div className="flex flex-col">
                  <h1 className="text-xl font-serif font-bold text-gold-400 leading-tight">anzaar</h1>
                  <p className="text-[8px] uppercase tracking-widest text-white/40">Order Engine</p>
               </div>
            )}
         </div>
         <button 
           onClick={() => setIsOpen(!isOpen)}
           className="p-2 bg-white/5 rounded-xl border border-white/10 text-gold-400"
         >
           <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-emerald-950 text-white flex flex-col z-[80] 
        transition-transform duration-500 ease-in-out border-r border-white/10
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:relative md:w-64 md:h-screen md:sticky md:top-0
      `}>
        <div className="p-8 hidden md:block">
           {settings?.logoUrl ? (
              <div className="flex flex-col items-start gap-2">
                 <div className="h-10 w-auto flex items-center overflow-visible">
                    <img 
                       src={settings.logoUrl} 
                       className="h-full w-auto object-contain brightness-125 scale-[1.5] origin-left ml-2" 
                       style={{ mixBlendMode: 'screen' }} 
                       alt="Brand Logo" 
                    />
                 </div>
                 <div className="w-10 h-0.5 bg-gold-400/5 rounded-full mt-1" />
                 <p className="text-[8px] uppercase tracking-[0.4em] text-white/20 font-black italic">Management</p>
              </div>
           ) : (
             <div>
                <h1 className="text-2xl font-serif font-bold text-gold-400 leading-none">anzaar</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mt-1">Order Engine</p>
             </div>
           )}
        </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              prefetch={true}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 font-medium active:scale-95 ${
                isActive 
                  ? 'bg-gold-500 text-emerald-950 shadow-lg shadow-gold-500/20' 
                  : 'hover:bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-950' : 'text-gold-400'}`} />
              <span className={isActive ? 'font-bold' : ''}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-3 px-2">
           <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-400/30 flex items-center justify-center font-bold text-gold-400">
             AZ
           </div>
           <div>
             <p className="text-sm font-bold">Admin User</p>
             <p className="text-[10px] text-white/40 uppercase">Senior Manager</p>
           </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-all text-sm font-bold w-full px-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
