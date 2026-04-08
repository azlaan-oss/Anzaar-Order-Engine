"use client";

import React from 'react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, ClipboardList, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Products', icon: Package, path: '/admin/products' },
  { name: 'Orders', icon: ClipboardList, path: '/admin/orders' },
  { name: 'New', icon: PlusCircle, path: '/orders/new' },
  { name: 'Reports', icon: ShoppingBag, path: '/admin/reports' },
  { name: 'Home', icon: LayoutDashboard, path: '/' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-[100]">
      <div className="bg-emerald-950/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1 shadow-2xl shadow-black/40 flex items-center justify-around relative overflow-hidden">
        
        {/* Glow Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center gap-1 flex-1 py-3"
            >
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                className={`transition-colors flex flex-col items-center ${isActive ? 'text-gold-400' : 'text-white/30'}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-white/50'}`} />
                <span className="text-[7px] font-black uppercase tracking-widest mt-1.5">{item.name}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeDot"
                    className="absolute -bottom-1 w-1 h-1 bg-gold-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
