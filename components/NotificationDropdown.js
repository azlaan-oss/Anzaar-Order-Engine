"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ShoppingBag, 
  AlertTriangle, 
  ChevronRight, 
  Clock, 
  Package, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import Link from 'next/link';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { allNotifications, totalCount, loading } = useNotifications();
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown Time';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-500 border ${
          isOpen 
          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xl' 
          : 'text-zinc-400 hover:text-zinc-950 border-black/5 hover:bg-black/5'
        }`}
      >
        <Bell className={`w-5 h-5 ${isOpen ? 'animate-none' : totalCount > 0 ? 'animate-bounce' : ''}`} />
        {totalCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black border-2 transition-colors ${
            isOpen ? 'bg-white text-zinc-950 border-zinc-950' : 'bg-red-500 text-white border-white'
          }`}>
             {totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute right-0 mt-4 w-[380px] bg-white/95 backdrop-blur-3xl border border-black/5 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.1)] overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="p-6 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
               <div className="space-y-1">
                  <h3 className="text-zinc-950 font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                     <ShieldAlert className="w-4 h-4 text-zinc-400" />
                     Command Alert Hub
                  </h3>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Live Synchronization Active</p>
               </div>
               {totalCount > 0 && (
                 <span className="bg-zinc-950/5 px-3 py-1 rounded-full text-[8px] font-black text-zinc-400 uppercase tracking-widest border border-black/5">
                   {totalCount} Alerts
                 </span>
               )}
            </div>

            {/* Content Array */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-3 space-y-2">
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-black/10 border-t-zinc-950 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Synching Vault...</p>
                 </div>
               ) : allNotifications.length === 0 ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30">
                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center border border-black/5">
                       <Package className="w-6 h-6 text-zinc-950" />
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em]">Clear Skies</p>
                       <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">No Priority Alerts Detected</p>
                    </div>
                 </div>
               ) : (
                 allNotifications.map((notif, idx) => (
                   <motion.div
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     key={notif.id}
                     className="group relative bg-black/[0.02] hover:bg-black/[0.05] p-4 rounded-3xl border border-black/5 transition-all cursor-pointer overflow-hidden"
                   >
                     {/* Type Indicator */}
                     <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                       notif.type === 'order' ? 'bg-zinc-950' : 'bg-zinc-400'
                     }`} />

                     <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          notif.type === 'order' 
                          ? 'bg-zinc-950 text-white border-zinc-950' 
                          : 'bg-zinc-400 text-white border-zinc-500'
                        }`}>
                           {notif.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-950 uppercase tracking-wider">{notif.title}</span>
                              <div className="flex items-center gap-1.5 text-zinc-400">
                                 <Clock className="w-2.5 h-2.5" />
                                 <span className="text-[8px] font-black uppercase">{formatTimestamp(notif.timestamp)}</span>
                              </div>
                           </div>
                           <p className="text-[10px] text-zinc-500 font-bold leading-relaxed line-clamp-2 uppercase tracking-wide">
                              {notif.message}
                           </p>
                        </div>
                     </div>

                     {/* Action Link Overlay */}
                     <Link 
                       href={notif.type === 'order' ? '/admin/orders' : '/admin/products'} 
                       onClick={() => setIsOpen(false)}
                       className="absolute inset-0 z-10"
                     />
                     
                     {/* Hover Arrow */}
                     <div className="absolute top-1/2 -right-4 -translate-y-1/2 group-hover:right-4 transition-all duration-500 opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-4 h-4 text-zinc-950" />
                     </div>
                   </motion.div>
                 ))
               )}
            </div>

            {/* Footer */}
            {allNotifications.length > 0 && (
              <div className="p-4 bg-black/[0.02] border-t border-black/5">
                 <Link 
                   href="/admin/orders" 
                   onClick={() => setIsOpen(false)}
                   className="w-full flex items-center justify-center gap-2 py-3 bg-black/5 hover:bg-black/10 rounded-2xl text-[9px] font-black text-zinc-400 hover:text-zinc-950 uppercase tracking-[0.3em] transition-all border border-black/5"
                 >
                    Access Full Archive
                    <ExternalLink className="w-3 h-3" />
                 </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
