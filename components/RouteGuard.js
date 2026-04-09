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
      if (requiredPermission && !hasPermission(userData?.role, requiredPermission)) {
        setAuthorized(false);
        return;
      }
    }

    setAuthorized(true);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-emerald-950 flex flex-col items-center justify-center space-y-4 z-[300000]">
         <div className="w-16 h-16 border-4 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
         <p className="text-gold-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Cryptographic Keys...</p>
      </div>
    );
  }

  if (!authorized && user && pathname !== '/login') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3.5rem] border border-red-100 p-12 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-red-100">
             <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-serif font-black text-emerald-950 uppercase tracking-tighter mb-4 italic">Access Denied</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10">
            Your current security clearance level is insufficient to access this terminal. Please contact a Super Admin for protocol recalibration.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-950 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Safe Zone
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-red-500/30">
             <Lock className="w-3 h-3" />
             <span className="text-[8px] font-black uppercase tracking-widest">Quantum Firewall Active</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return authorized ? children : null;
}
