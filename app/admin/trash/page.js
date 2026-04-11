"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from 'react';
import { 
  getTrashItems, 
  restoreFromTrash, 
  cleanupTrash, 
  purgeFromTrash 
} from '../../../lib/firebase-utils';
import { 
  Trash2, 
  RotateCcw, 
  ShoppingBag, 
  Package, 
  Clock, 
  Calendar,
  Search,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrash = async () => {
    setLoading(true);
    await cleanupTrash();
    const data = await getTrashItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (trashId) => {
    try {
      await restoreFromTrash(trashId);
      toast.success("Item successfully recovered from the void");
      fetchTrash();
    } catch (err) {
      toast.error("Recovery failed: " + err.message);
    }
  };

  const handlePurge = async (trashId, name) => {
    const confirmation = window.confirm(`WARNING: Are you sure you want to permanently delete "${name}"? This action CANNOT be undone.`);
    if (!confirmation) return;

    const toastId = toast.loading("Purging from existence...");
    try {
      await purgeFromTrash(trashId);
      toast.success("Destroyed forever", { id: toastId });
      fetchTrash();
    } catch (err) {
      toast.error("Vaporization failed", { id: toastId });
    }
  };

  const filteredItems = items.filter(item => {
    const name = item.data?.name || item.data?.customer?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Link href="/admin/products" className="p-2 bg-white border border-black/5 rounded-xl hover:bg-zinc-50 text-zinc-950 transition-all shadow-sm">
                  <ArrowLeft className="w-5 h-5" />
               </Link>
               <div className="px-3 py-1 bg-white text-zinc-950 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-black/5 shadow-sm">
                  Recovery Vault
               </div>
            </div>
            <div className="space-y-2">
               <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none">The <span className="text-zinc-300">Vault</span></h1>
               <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em]">Protocol: Auto-vaporize duration: 07 days</p>
            </div>
        </div>

         <div className="bg-white p-1 rounded-2xl flex items-center px-4 gap-3 shadow-xl w-full md:w-80 border border-black/5">
            <Search className="text-zinc-300 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search Vault..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-zinc-950 text-[10px] font-black w-full focus:outline-none placeholder:text-zinc-200 h-10 uppercase tracking-widest"
            />
         </div>
      </div>

      {/* Trash List */}
      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />
          ))
         ) : filteredItems.length === 0 ? (
          <div className="py-40 bg-white border border-black/5 rounded-[4rem] text-center space-y-10 shadow-xl">
             <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 bg-zinc-50 rounded-full blur-3xl animate-pulse" />
                <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto shadow-inner relative z-10 border border-black/5">
                   <Trash2 className="w-10 h-10 text-zinc-200" />
                </div>
             </div>
             <div className="space-y-3">
                <h3 className="text-2xl font-black text-zinc-950 uppercase tracking-tighter">Vault is Empty</h3>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto">No items in retention. Your workspace is perfectly clean.</p>
             </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemName = item.data?.name || `Order #${item.data?.orderId || 'Unknown'}`;
            return (
               <motion.div 
                key={item.trashId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-zinc-50 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${item.originalCollection === 'products' ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-400'} border border-black/5 transition-transform group-hover:scale-110`}>
                    {item.originalCollection === 'products' ? <Package className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                  </div>
                   <div>
                    <h4 className="text-lg font-black text-zinc-950 uppercase tracking-tight">{itemName}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                         <Clock className="w-3 h-3" />
                         Deleted Protocol: {new Date(item.deletedAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                         <Calendar className="w-3 h-3" />
                         Retention: {Math.max(0, Math.ceil((item.expiresAt?.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))} days
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="flex items-center gap-3">
                   <button 
                     onClick={() => handleRestore(item.trashId)}
                     className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-zinc-950 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl active:scale-95"
                   >
                     <RotateCcw className="w-4 h-4" />
                     Restore
                   </button>
                   <button 
                     onClick={() => handlePurge(item.trashId, itemName)}
                     className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-zinc-400 px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-zinc-50 hover:text-zinc-950 transition-all border border-black/5 active:scale-95"
                   >
                     <XCircle className="w-4 h-4" />
                     Purge
                   </button>
                 </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
