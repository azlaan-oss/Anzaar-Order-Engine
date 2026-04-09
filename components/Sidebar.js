"use client";

import React from 'react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Settings, LogOut, Package, ClipboardList, FileSpreadsheet, Trash2, Menu, X } from 'lucide-react';
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
  { name: 'Reports', icon: ClipboardList, path: '/admin/reports', permission: PERMISSIONS.VIEW_REPORTS },
  { name: 'Trash', icon: Trash2, path: '/admin/trash', permission: PERMISSIONS.VIEW_TRASH },
  { name: 'Access Control', icon: ShieldCheck, path: '/admin/access', permission: PERMISSIONS.MANAGE_USERS },
  { name: 'Settings', icon: Settings, path: '/admin/settings', permission: PERMISSIONS.EDIT_SETTINGS },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState(null);
  const { user, userData, logout } = useAuth();

  const menuItems = ALL_MENU_ITEMS.filter(item => 
    hasPermission(userData?.role, item.permission)
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
      <div className="md:hidden bg-emerald-950 p-4 flex items-center justify-between sticky top-0 z-[60] border-b border-white/5">
         <div className="flex items-center justify-between">
            {settings?.logoUrl ? (
               <Link href="/" className="active:scale-95 transition-transform">
                  <div className="h-7 w-auto flex items-center justify-center overflow-visible">
                     <img 
                        src={settings.logoUrl} 
                        className="h-full w-auto object-contain brightness-150 origin-left ml-1" 
                        style={{ 
                          mixBlendMode: 'screen',
                          transform: `scale(${settings.logoScale ? settings.logoScale * 0.8 : 1.2})` 
                        }} 
                        alt="Brand Logo" 
                     />
                  </div>
               </Link>
            ) : (
               <Link href="/" className="flex flex-col h-7 justify-center">
                  <div className="w-20 h-4 bg-white/5 rounded-full animate-pulse md:hidden" />
               </Link>
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
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity active:scale-95">
                 <div className="h-10 w-auto flex items-center overflow-visible">
                    <img 
                       src={settings.logoUrl} 
                       className="h-full w-auto object-contain brightness-125 origin-left ml-2 transition-transform duration-300" 
                       style={{ 
                          mixBlendMode: 'screen',
                          transform: `scale(${settings.logoScale || 1.5})` 
                       }} 
                       alt="Brand Logo" 
                    />
                 </div>
              </Link>
           ) : (
             <Link href="/" className="inline-block">
                <div className="w-32 h-8 bg-white/5 rounded-2xl animate-pulse hidden md:block" />
             </Link>
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
        {userData && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-400/30 flex items-center justify-center font-bold text-gold-400 font-serif">
              {userData.name?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{userData.name || 'Agent'}</p>
              <div className="flex items-center gap-1">
                 <div className={`w-1 h-1 rounded-full ${userData.role === ROLES.SUPER_ADMIN ? 'bg-gold-400' : 'bg-emerald-400'}`} />
                 <p className="text-[9px] text-white/40 uppercase tracking-widest truncate">{userData.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-white/40 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-widest w-full px-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Vault</span>
        </button>
      </div>
    </aside>
    </>
  );
}
