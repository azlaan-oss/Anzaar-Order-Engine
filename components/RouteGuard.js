"use client";

import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '../lib/permissions';
import Link from 'next/link';

export default function RouteGuard({ children }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      authCheck(pathname);
    }
  }, [loading, pathname, user, userData]);

  function authCheck(url) {
    // 1. Allow Login Page
    if (url === '/login') {
      setAuthorized(true);
      return;
    }

    // 2. Redirect to Login if not authenticated
    if (!user) {
      setAuthorized(false);
      router.push('/login');
      return;
    }

    // 3. Permission Check for Admin routes
    if (url.startsWith('/admin')) {
      const permissionMap = {
        '/admin/products': PERMISSIONS.VIEW_VAULT,
        '/admin/orders': PERMISSIONS.VIEW_ORDERS,
        '/admin/access': PERMISSIONS.MANAGE_USERS,
        '/admin/settings': PERMISSIONS.EDIT_SETTINGS,
        '/admin/reports': PERMISSIONS.VIEW_REPORTS,
        '/admin/trash': PERMISSIONS.VIEW_TRASH,
        '/admin/sheets': PERMISSIONS.EXPORT_DATA,
      };

      const requiredPermission = permissionMap[url];
      if (requiredPermission && !hasPermission(userData, requiredPermission)) {
        setAuthorized(false);
        return;
      }
    }

    setAuthorized(true);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#B5B8B1] flex flex-col items-center justify-center space-y-6 z-[300000]">
         <div className="relative">
            <div className="w-20 h-20 border-4 border-zinc-950/5 border-t-zinc-950 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-10 h-10 border-4 border-zinc-950/5 border-b-zinc-950 rounded-full animate-spin-slow" />
            </div>
         </div>
         <div className="flex flex-col items-center gap-2">
            <p className="text-zinc-950 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Initializing Portal...</p>
            <div className="w-32 h-0.5 bg-zinc-950/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ x: '-100%' }}
                 animate={{ x: '100%' }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                 className="w-full h-full bg-zinc-950" 
               />
            </div>
         </div>
      </div>
    );
  }

  if (!authorized && user && pathname !== '/login') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel rounded-[3.5rem] border border-red-500/20 p-12 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
          <div className="w-24 h-24 bg-red-500/10 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-red-500/20 backdrop-blur-xl">
              <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-serif font-black text-zinc-950 uppercase tracking-tighter mb-4 italic">Access Denied</h2>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-10 opacity-70">
            Authorization failure. Your security token does not grant clearance for this sector. 
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-3 bg-zinc-950 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Relocate to Safety
          </Link>
          <div className="mt-10 flex items-center justify-center gap-2 text-red-500/40">
             <Lock className="w-3 h-3" />
             <span className="text-[8px] font-black uppercase tracking-widest">Orbital Firewall Active</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return authorized ? children : null;
}
