"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { ROLES } from '../lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ShieldCheck, ChevronDown, Bell } from 'lucide-react';
import Link from 'next/link';

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
    <header className="sticky top-0 z-40 bg-white/50 dark:bg-emerald-950/50 backdrop-blur-2xl border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between mb-8 shadow-sm">
      
      {/* Left side minimal identifier or breadcrumbs could go here, keeping it clean for now */}
      <div className="flex items-center gap-3">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 dark:text-white/40">Secure Connection</span>
      </div>

      {/* Right Side: Operations */}
      <div className="flex items-center gap-6">
        
        {/* Notification Bell (Visual only for now) */}
        <button className="relative p-2 text-gray-400 hover:text-emerald-950 dark:hover:text-gold-400 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-emerald-950"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1 pr-3 bg-white dark:bg-emerald-900/30 border border-gray-100 dark:border-white/10 rounded-full shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-950 dark:bg-black/40 flex items-center justify-center font-bold text-gold-400 font-serif border border-gold-400/20 group-hover:scale-105 transition-transform">
              {userData.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden md:block text-left mr-1">
              <p className="text-xs font-bold text-emerald-950 dark:text-white truncate max-w-[100px] leading-tight">{userData.name || 'Agent'}</p>
              <p className="text-[9px] text-emerald-900/50 dark:text-white/40 uppercase tracking-widest leading-tight">{userData.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-64 bg-white dark:bg-emerald-950 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-center flex flex-col items-center">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-950 border-2 border-gold-400/20 flex items-center justify-center text-2xl font-serif font-black text-gold-400 mb-3 shadow-inner">
                      {userData.name?.[0]?.toUpperCase() || 'A'}
                   </div>
                   <p className="font-bold text-emerald-950 dark:text-white uppercase tracking-tight">{userData.name || 'Agent'}</p>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest">{userData.email}</p>
                   <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                      {userData.role === ROLES.SUPER_ADMIN ? <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-gold-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Clearance: {userData.role?.replace('_', ' ')}</span>
                   </div>
                </div>

                <div className="p-3">
                  <Link 
                    href="/admin/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 dark:text-white/70 hover:bg-emerald-50 dark:hover:bg-white/5 hover:text-emerald-950 dark:hover:text-white transition-colors"
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
