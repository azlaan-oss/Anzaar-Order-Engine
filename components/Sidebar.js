"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, LogOut, Package, ClipboardList, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'New Order', icon: PlusCircle, path: '/orders/new' },
  { name: 'Inventory', icon: Package, path: '/admin/products' },
  { name: 'All Orders', icon: ClipboardList, path: '/admin/orders' },
  { name: 'Reports', icon: ClipboardList, path: '/admin/reports' },
  { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [branding, setBranding] = useState({ name: 'anzaar', logo: '' });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBranding({
          name: data.siteName || 'anzaar',
          logo: data.siteLogoUrl || ''
        });
      }
    });
    return () => unsub();
  }, []);

  return (
    <aside className="w-full md:w-64 bg-emerald-950 text-white flex flex-col h-screen md:sticky md:top-0 border-r border-white/10">
      <div className="p-8 flex items-center gap-3">
        {branding.logo ? (
          <img src={branding.logo} alt="Logo" className="w-10 h-10 object-contain" />
        ) : (
          <div className="w-10 h-10 bg-gold-400/20 rounded-xl flex items-center justify-center border border-gold-400/30">
             <Zap className="w-6 h-6 text-gold-400" />
          </div>
        )}
        <div>
           <h1 className="text-2xl font-serif font-black text-gold-400 leading-none">{branding.name}</h1>
           <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-black mt-1">Order Engine</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                isActive 
                  ? 'bg-gold-500 text-emerald-950 shadow-lg shadow-gold-500/20' 
                  : 'hover:bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-950' : 'text-gold-400'}`} />
              <span>{item.name}</span>
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
  );
}
