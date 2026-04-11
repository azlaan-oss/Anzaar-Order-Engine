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
      <div className="bg-white/90 backdrop-blur-3xl border border-black/5 rounded-[2.5rem] px-2 h-20 shadow-[0_25px_60px_rgba(0,0,0,0.1)] flex items-center justify-around relative">
        
        {/* Glass Edge Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-zinc-950/10 to-transparent rounded-full" />

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          if (item.special) {
            return (
              <Link key={item.path} href={item.path} className="relative -mt-12 group">
                <motion.div 
                   whileTap={{ scale: 0.9 }}
                   className="bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-zinc-950/40 border-4 border-white text-white relative z-10"
                >
                   <item.icon className="w-8 h-8" />
                </motion.div>
                <div className="absolute inset-0 bg-zinc-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
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
                className={`flex flex-col items-center transition-all duration-300 ${isActive ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-950'}`}
              >
                <item.icon className={`${isActive ? 'w-7 h-7' : 'w-6 h-6'}`} />
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-zinc-950 opacity-100' : 'text-zinc-400'}`}>
                  {item.name}
                </span>
                
                {isActive && (
                   <motion.div 
                     layoutId="activeGlow"
                     className="absolute -bottom-3 w-1.5 h-1.5 bg-zinc-950 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-black/10"
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
