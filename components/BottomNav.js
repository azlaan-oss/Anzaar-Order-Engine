"use client";

import React from 'react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, ClipboardList, Package } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Products', icon: Package, path: '/admin/products' },
  { name: 'Orders', icon: ClipboardList, path: '/admin/orders' },
  { name: 'New', icon: PlusCircle, path: '/orders/new', special: true },
  { name: 'Reports', icon: ShoppingBag, path: '/admin/reports' },
  { name: 'Home', icon: LayoutDashboard, path: '/' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-[100]">
      <div className="bg-[#022c22] border border-white/20 rounded-[2rem] px-2 h-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around relative">
        
        {/* Decorative Top Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gold-400/40 rounded-full" />

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          if (item.special) {
            return (
              <Link key={item.path} href={item.path} className="relative -mt-12 group">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className="bg-gold-500 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-gold-500/50 border-4 border-emerald-950 text-emerald-950 relative z-10"
                >
                  <item.icon className="w-8 h-8" />
                </motion.div>
                <div className="absolute inset-0 bg-gold-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="flex flex-col items-center gap-1.5 flex-1 relative"
            >
              <motion.div
                animate={isActive ? { y: -2 } : { y: 0 }}
                className={`flex flex-col items-center transition-all duration-300 ${isActive ? 'text-gold-400' : 'text-white/60'}`}
              >
                <item.icon className={`${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} />
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-gold-400 opacity-100' : 'text-white opacity-80'}`}>
                  {item.name}
                </span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeGlow"
                    className="absolute -bottom-3 w-1.5 h-1.5 bg-gold-400 rounded-full shadow-[0_0_12px_#fbbf24]"
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
