"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { ROLES } from '../lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ShieldCheck, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';

export default function Header() {
  const { userData, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  if (!userData) return null;

  return (
    <header className="hidden md:flex glass-header px-6 py-4 items-center justify-between shadow-sm backdrop-blur-3xl">
      
      {/* Left side minimal identifier or breadcrumbs could go here, keeping it clean for now */}
       <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse shadow-sm" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Administrative Terminal</span>
       </div>

      {/* Right Side: Operations */}
      <div className="flex items-center gap-6">
        
        {/* Dynamic Notification Bell */}
        <NotificationDropdown />

        {/* Profile Dropdown */}
         <div className="relative" ref={dropdownRef}>
           <button 
             onClick={() => setDropdownOpen(!dropdownOpen)}
             className="flex items-center gap-3 p-1 pr-3 bg-black/5 backdrop-blur-md border border-black/5 rounded-full shadow-sm hover:bg-black/10 transition-all group"
           >
             <div className="w-9 h-9 rounded-full bg-zinc-950 flex items-center justify-center font-bold text-gold-400 font-serif border border-gold-400/20 group-hover:scale-105 transition-transform shadow-xl">
               {userData.name?.[0]?.toUpperCase() || 'A'}
             </div>
             <div className="hidden md:block text-left mr-1">
               <p className="text-xs font-bold text-zinc-950 truncate max-w-[100px] leading-tight">{userData.name || 'Agent'}</p>
               <p className="text-[9px] text-zinc-400 uppercase tracking-widest leading-tight">{userData.role?.replace('_', ' ')}</p>
             </div>
             <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
           </button>

          <AnimatePresence>
            {dropdownOpen && (
               <motion.div
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                 transition={{ duration: 0.2 }}
                 className="absolute right-0 mt-3 w-64 glass-panel rounded-[2rem] border border-black/5 shadow-2xl overflow-hidden"
               >
                 <div className="p-6 bg-black/[0.02] border-b border-black/5 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 border-2 border-gold-400/20 flex items-center justify-center text-2xl font-serif font-black text-gold-400 mb-3 shadow-inner">
                       {userData.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <p className="font-bold text-zinc-950 uppercase tracking-tight">{userData.name || 'Agent'}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{userData.email}</p>
                    <div className="mt-3 flex items-center gap-1.5 px-3 py-1 glass-pill border border-black/5">
                       {userData.role === ROLES.SUPER_ADMIN ? <ShieldCheck className="w-3 h-3 text-gold-400" /> : <ShieldCheck className="w-3 h-3 text-zinc-400" />}
                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Clearance: {userData.role?.replace('_', ' ')}</span>
                    </div>
                 </div>

                <div className="p-3">
                  <Link 
                    href="/admin/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
