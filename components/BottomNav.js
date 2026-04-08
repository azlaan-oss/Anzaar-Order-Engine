"use client";

import React from 'react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', icon: LayoutDashboard, path: '/' },
  { name: 'Orders', icon: ClipboardList, path: '/admin/orders' },
  { name: 'New', icon: PlusCircle, path: '/orders/new', primary: true },
  { name: 'Reports', icon: ShoppingBag, path: '/admin/reports' },
  { name: 'Tools', icon: Settings, path: '/admin/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
      <div className="bg-emerald-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 shadow-2xl shadow-black/40 flex items-center justify-between relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gold-400/20 rounded-full blur-md" />

        {navItems.map((item) => {
          const isActive = pathname === item.path;
          
          if (item.primary) {
            return (
              <Link key={item.path} href={item.path} className="relative group -mt-10">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-gold-500 p-4 rounded-3xl shadow-xl shadow-gold-500/40 border-4 border-emerald-950 text-emerald-950"
                >
                  <item.icon className="w-7 h-7" />
                </motion.div>
                <div className="absolute -inset-2 bg-gold-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="relative flex flex-col items-center gap-1 flex-1 py-2"
            >
              <motion.div
                animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                className={`transition-colors flex flex-col items-center ${isActive ? 'text-gold-400' : 'text-white/40'}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-white/60'}`} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1">{item.name}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-2 w-1 h-1 bg-gold-400 rounded-full"
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
