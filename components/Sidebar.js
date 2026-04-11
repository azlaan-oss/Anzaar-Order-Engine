"use client";

import React from 'react';
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, Settings, LogOut, Package, 
  ClipboardList, FileSpreadsheet, Trash2, Menu, X, ShieldCheck, 
  BarChart3, Bell, ChevronDown, User 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../lib/auth-context';
import { ROLES, PERMISSIONS, hasPermission } from '../lib/permissions';

const ALL_MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', permission: PERMISSIONS.VIEW_VAULT },
  { name: 'New Order', icon: PlusCircle, path: '/orders/new', permission: PERMISSIONS.CREATE_ORDER },
  { name: 'Products', icon: Package, path: '/admin/products', permission: PERMISSIONS.VIEW_VAULT },
  { name: 'All Orders', icon: ClipboardList, path: '/admin/orders', permission: PERMISSIONS.VIEW_ORDERS },
  { name: 'Spreadsheet', icon: FileSpreadsheet, path: '/admin/sheets', permission: PERMISSIONS.EXPORT_DATA },
  { name: 'Reports', icon: BarChart3, path: '/admin/reports', permission: PERMISSIONS.VIEW_REPORTS },
  { name: 'Trash', icon: Trash2, path: '/admin/trash', permission: PERMISSIONS.VIEW_TRASH },
  { name: 'Access Control', icon: ShieldCheck, path: '/admin/access', permission: PERMISSIONS.MANAGE_USERS },
  { name: 'Settings', icon: Settings, path: '/admin/settings', permission: PERMISSIONS.EDIT_SETTINGS },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const { user, userData, logout } = useAuth();

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const menuItems = ALL_MENU_ITEMS.filter(item => 
    hasPermission(userData, item.permission)
  );

  React.useEffect(() => {
    // 1. Instantly load from cache to prevent flash
    const cached = localStorage.getItem('anzaar_branding');
    if (cached) {
      try {
        setSettings(JSON.parse(cached));
      } catch (e) {
        console.error("Cache restore failed", e);
      }
    }

    // 2. Sync with Firestore for real-time updates
    return onSnapshot(doc(db, "settings", "global"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettings(data);
        // Persist for next reload
        localStorage.setItem('anzaar_branding', JSON.stringify(data));
      }
    });
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden glass-header px-6 h-20 flex items-center justify-between sticky top-0 z-[60] shadow-xl">
         <div className="flex items-center gap-3">
            {settings?.logoUrl && (
               <Link href="/" className="active:scale-95 transition-transform">
                  <div className="h-6 w-auto flex items-center justify-center overflow-visible">
                     <img 
                        src={settings.logoUrl} 
                        className="h-full w-auto object-contain brightness-150 origin-left" 
                        style={{ 
                          mixBlendMode: 'screen',
                          transform: `scale(${settings.logoScale ? settings.logoScale * 0.7 : 1.1})` 
                        }} 
                        alt="Brand Logo" 
                     />
                  </div>
               </Link>
            )}
         </div>

         <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button className="relative p-2 text-zinc-400 hover:text-zinc-950 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 p-1 bg-black/5 border border-black/5 rounded-full active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center font-bold text-white text-sm border border-white/20 shadow-xl">
                  {userData?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 glass-panel rounded-[1.5rem] shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 bg-zinc-950/5 border-b border-black/5 text-center flex flex-col items-center">
                         <p className="font-bold text-zinc-950 text-xs uppercase tracking-tight">{userData?.name || 'Agent'}</p>
                         <p className="text-[8px] text-zinc-400 uppercase tracking-widest mt-1">{userData?.email}</p>
                      </div>
                      <div className="p-2">
                      <Link 
                        href="/admin/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-bold text-zinc-500 hover:bg-zinc-950/5 hover:text-zinc-950"
                      >
                        <User className="w-3.5 h-3.5" />
                        PROFILE
                      </Link>
                      <button 
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-bold text-red-500 hover:bg-red-500/10"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        SIGN OUT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
         </div>
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
        fixed inset-y-0 left-0 w-80 bg-white/60 backdrop-blur-3xl text-zinc-950 flex flex-col z-[80] 
        transition-transform duration-500 ease-in-out border-r border-black/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:relative md:w-64 md:h-screen md:sticky md:top-0 shadow-2xl
      `}>
        {/* Sidebar Header - Enhanced */}
        <div className="p-8 pb-4">
           {settings?.logoUrl ? (
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity active:scale-95 mb-8">
                 <div className="h-12 w-auto flex items-center overflow-visible">
                    <img 
                       src={settings.logoUrl} 
                       className="h-full w-auto object-contain brightness-0 origin-left ml-2 transition-transform duration-300" 
                       style={{ 
                          transform: `scale(${settings.logoScale || 1.4})` 
                       }} 
                       alt="Brand Logo" 
                    />
                 </div>
              </Link>
           ) : (
             <div className="w-32 h-10 bg-white/5 rounded-2xl animate-pulse mb-8" />
           )}

           {/* Quick User Identity (Mobile Only in Sidebar) */}
           <div className="md:hidden flex items-center gap-4 p-4 rounded-3xl bg-black/5 border border-black/5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/20">
                 {userData?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                 <p className="text-sm font-black text-zinc-950 uppercase tracking-tight leading-tight">{userData?.name || 'Agent'}</p>
                 <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{userData?.role?.replace('_', ' ')}</p>
              </div>
           </div>
        </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar py-4">
        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] px-4 mb-4">Core Management</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              prefetch={true}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
                isActive 
                  ? 'bg-zinc-950/5 text-zinc-950 shadow-sm border border-black/5' 
                  : 'hover:bg-zinc-950/5 text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-950'}`} />
              <span className={`text-sm tracking-tight ${isActive ? 'font-black text-zinc-950' : 'font-bold text-zinc-400 group-hover:text-zinc-950'}`}>{item.name}</span>
              
              {isActive && (
                <motion.div 
                  layoutId="activePill"
                  className="absolute left-0 w-1.5 h-6 bg-zinc-950 rounded-r-full shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

       {/* Footer Actions */}
      <div className="p-6 border-t border-black/5 mt-auto">
         <button 
           onClick={() => { setIsOpen(false); logout(); }}
           className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors font-black text-xs tracking-widest"
         >
           <LogOut className="w-5 h-5" />
           TERMINATE SESSION
         </button>
      </div>
    </aside>

    {/* Floating Bottom Navigation (Mobile Only) - Animated Hide on Sidebar Open */}
    <AnimatePresence>
      {!isOpen && (
        <motion.div 
          initial={{ y: 100, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: 100, x: '-50%', opacity: 0 }}
          transition={{ duration: 0.4, ease: "circOut" }}
          className="md:hidden fixed bottom-6 left-1/2 w-[95%] max-w-md h-20 bg-white/90 backdrop-blur-3xl border border-black/5 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.1)] z-[100] flex items-center justify-around px-2"
        >
           {/* Decorative Top Highlight */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-zinc-950/20 rounded-full" />

           {[
             { icon: BarChart3, path: '/admin/reports', label: 'Reports' },
             { icon: ClipboardList, path: '/admin/orders', label: 'Orders' },
             { icon: PlusCircle, path: '/orders/new', label: 'New', special: true },
             { icon: LayoutDashboard, path: '/', label: 'Home' },
             { icon: Menu, label: 'Menu', onClick: () => setIsOpen(true) }
           ].map((btn, i) => {
             const isBtnActive = !btn.onClick && pathname === btn.path;
             
              const content = (
                 <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${isBtnActive ? 'text-zinc-950' : 'text-zinc-400'}`}>
                    <btn.icon className={isBtnActive ? 'w-5.5 h-5.5' : 'w-5 h-5'} />
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isBtnActive ? 'text-zinc-950' : 'text-zinc-400'}`}>
                       {btn.label}
                    </span>
                 </div>
              );

             if (btn.special) {
               return (
                  <Link key={btn.path} href={btn.path} className="relative -mt-14 active:scale-95 transition-transform duration-300">
                     <motion.div 
                        animate={{ 
                           boxShadow: ["0 0 15px rgba(0,0,0,0.05)", "0 0 35px rgba(0,0,0,0.1)", "0 0 15px rgba(0,0,0,0.05)"] 
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-zinc-950 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.1)] border-[6px] border-white text-white relative z-10"
                     >
                        <btn.icon className="w-8 h-8 text-white" />
                     </motion.div>
                     <div className="absolute inset-0 bg-white blur-3xl opacity-20 rounded-full" />
                  </Link>
               );
             }

             return btn.onClick ? (
               <button key={i} onClick={btn.onClick} className="flex-1 flex flex-col items-center active:scale-90 transition-transform">{content}</button>
             ) : (
               <Link key={btn.path} href={btn.path} className="flex-1 flex flex-col items-center active:scale-90 transition-transform">{content}</Link>
             );
           })}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
