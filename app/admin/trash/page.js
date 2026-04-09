"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from 'react';
import { getTrashItems, restoreFromTrash, cleanupTrash } from '../../../lib/firebase-utils';
import { 
  Trash2, 
  RotateCcw, 
  ShoppingBag, 
  Package, 
  Clock, 
  Calendar,
  Search,
  ChevronRight,
  ArrowLeft
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
              <Link href="/admin/products" className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-emerald-50 text-emerald-950 transition-all shadow-sm">
                 <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                 Recovery Vault
              </div>
           </div>
           <div className="space-y-2">
              <h1 className="text-5xl font-serif font-black text-emerald-950 tracking-tight">The Trash Bin</h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Items auto-vaporize after 7 days</p>
           </div>
        </div>

        <div className="bg-emerald-950 p-1 rounded-2xl flex items-center px-4 gap-3 shadow-xl w-full md:w-80">
           <Search className="text-emerald-500 w-4 h-4" />
           <input 
             type="text" 
             placeholder="Search Trash..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="bg-transparent border-none text-white text-[10px] font-bold w-full focus:outline-none placeholder:text-white/20 h-10"
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
          <div className="py-32 bg-white border-4 border-dashed border-gray-50 rounded-[4rem] text-center space-y-6">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <Trash2 className="w-10 h-10 text-gray-200" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black text-gray-950">Vault is Empty</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">No items in retention. Your workspace is perfectly clean.</p>
             </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div 
              key={item.trashId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${item.originalCollection === 'products' ? 'bg-emerald-50 text-emerald-950' : 'bg-blue-50 text-blue-600'}`}>
                  {item.originalCollection === 'products' ? <Package className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-lg font-black text-emerald-950">
                    {item.data?.name || `Order #${item.data?.orderId || 'Unknown'}`}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <Clock className="w-3 h-3" />
                       Deleted {new Date(item.deletedAt?.seconds * 1000).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest">
                       <Calendar className="w-3 h-3" />
                       Expires in {Math.max(0, Math.ceil((item.expiresAt?.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleRestore(item.trashId)}
                className="flex items-center gap-2 bg-emerald-950 text-gold-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all shadow-xl active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Item
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
