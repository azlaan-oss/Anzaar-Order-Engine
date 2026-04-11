"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { 
  ShoppingBag, 
  TrendingUp, 
  CreditCard, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  Download, 
  ArrowUpRight, 
  Eye,
  CheckSquare,
  Square,
  Printer,
  XCircle,
  Truck,
  ChevronDown,
  Phone,
  AlertCircle
} from 'lucide-react';
import { updateOrder } from '../../../lib/firebase-utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import OrderDetailModal from '../../../components/OrderDetailModal';

export default function OrdersPage() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ gross: 0, net: 0, due: 0 });
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filter State
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Optimization: Fetch only most recent 100 or filter by date on-demand
    let q = query(
      collection(db, "orders"), 
      orderBy("timestamp", "desc"),
      limit(200)
    );

    // If 'Today' is selected, we only fetch today's orders to save reads
    if (dateFilter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      q = query(
        collection(db, "orders"),
        where("timestamp", ">=", startOfDay.getTime()),
        orderBy("timestamp", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
      setLoading(false);
    }, (err) => {
      console.error("Stream Error:", err);
      setLoading(false);
    });

    const fetchSettings = async () => {
      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      if (settingsSnap.exists()) setSettings(settingsSnap.data());
    };
    
    fetchSettings();
    return () => unsubscribe();
  }, [dateFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer?.phone?.includes(searchQuery) ||
        o.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesUrgency = !isUrgentOnly || o.isUrgent === true;

      const orderDate = new Date(o.timestamp);
      const now = new Date();
      let matchesDate = true;

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        if (start && end) {
          matchesDate = orderDate >= start && orderDate <= end;
        } else if (start) {
          matchesDate = orderDate >= start;
        } else if (end) {
          matchesDate = orderDate <= end;
        }
      } else if (dateFilter === 'today') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        matchesDate = orderDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === '7days') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === '30days') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        matchesDate = orderDate >= monthAgo;
      }

      return matchesSearch && matchesUrgency && matchesDate;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, searchQuery, dateFilter, startDate, endDate, isUrgentOnly]);

  // Paginated Data
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, startDate, endDate, isUrgentOnly]);

  const handleQuickStatusUpdate = async (e, orderId, newStatus) => {
    e.stopPropagation();
    try {
      await updateOrder(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order set to ${newStatus}`);
    } catch (err) {
      toast.error("Status synchronization failed");
    }
  };

  const toggleSelection = (e, id) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkPrint = () => {
    toast.info("Initializing multi-stream print sequence...");
  };

  const topStats = [
    { label: 'Gross Volume', value: stats.gross, icon: TrendingUp, color: 'text-white', bg: 'bg-white/10' },
    { label: 'Net Collected', value: stats.net, icon: CheckCircle2, color: 'text-white', bg: 'bg-white/10' },
    { label: 'Total Due', value: stats.due, icon: CreditCard, color: 'text-white', bg: 'bg-white/10' },
  ];

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col gap-6">
      
      {/* Engineered Filter Hub - Detached from Header */}
      <div className="flex flex-col gap-4 mt-6 md:mt-0">
        {/* Layer 1: Search & Filter Matrix */}
         <div className="flex flex-col gap-3 px-4 md:px-0">
            <div className="bg-white p-1.5 rounded-2xl flex items-center px-4 gap-3 shadow-xl border border-black/5">
               <Search className="text-zinc-400 w-4 h-4" />
               <input 
                type="text" 
                placeholder="SEARCH ORDERS..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-zinc-950 text-[11px] font-black w-full focus:outline-none placeholder:text-zinc-300 h-10 tracking-widest"
               />
            </div>

            <div className="flex items-center gap-3">
             <div className="flex-1 flex items-center gap-2 bg-white rounded-[1.25rem] p-2 border border-black/5 shadow-xl text-zinc-950 overflow-hidden">
                 <Calendar className="w-4 h-4 ml-2 text-zinc-400 shrink-0" />
                 <div className="flex items-center gap-2 w-full">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={e => {
                          setStartDate(e.target.value);
                          setDateFilter('range');
                      }}
                      className="bg-transparent border-none text-[10px] font-black outline-none cursor-pointer uppercase w-full text-zinc-950 [color-scheme:light]"
                    />
                    <span className="text-zinc-200 font-black">/</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={e => {
                          setEndDate(e.target.value);
                          setDateFilter('range');
                      }}
                      className="bg-transparent border-none text-[10px] font-black outline-none cursor-pointer uppercase w-full text-zinc-950 [color-scheme:light]"
                    />
                 </div>
               </div>

               <button 
                 onClick={() => setIsUrgentOnly(!isUrgentOnly)}
                 className={`flex items-center justify-center h-12 w-12 md:w-auto md:px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                    isUrgentOnly 
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20' 
                    : 'bg-white text-red-500 border-black/5 shadow-lg shadow-red-500/5'
                 }`}
               >
                  <AlertCircle className="w-5 h-5" />
                  <span className="hidden md:inline ml-2">Urgent Only</span>
               </button>
            </div>
        </div>

         <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-0 px-4 md:px-0 mt-2">
             <div className="flex bg-white p-1.5 rounded-2xl border border-black/5 shadow-xl overflow-x-auto no-scrollbar flex-nowrap min-w-0 w-full md:w-auto">
                {['all', 'today', 'yesterday', '7days', '30days'].map((d) => (
                   <button
                      key={d}
                      onClick={() => {
                          setDateFilter(d);
                          setStartDate('');
                          setEndDate('');
                      }}
                      className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap shrink-0 ${
                         dateFilter === d && !startDate 
                         ? 'bg-zinc-950 text-white shadow-md' 
                         : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                   >
                      {d === 'all' ? 'All Orders' : d === '30days' ? 'Month' : d === '7days' ? 'Week' : d}
                   </button>
                ))}
             </div>
             
             <div className="hidden md:block text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] pr-4">
                {filteredOrders.length} Protocols Loaded
             </div>
         </div>
      </div>

        {/* Selection Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className="bg-zinc-950 rounded-3xl p-4 flex items-center justify-between shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-6 px-4">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{selectedIds.length} Orders Selected</span>
                 <div className="h-4 w-px bg-zinc-800" />
                 <button onClick={() => setSelectedIds([])} className="text-[10px] font-black text-zinc-500 uppercase hover:text-white transition-colors">Clear Selection</button>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={handleBulkPrint}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5"
                 >
                   <Printer className="w-3.5 h-3.5 text-zinc-400" />
                   Batch Print
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border border-black/5 overflow-hidden relative flex flex-col">
        {loading && orders.length === 0 ? null : filteredOrders.length > 0 ? (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0 hidden md:table">
              <thead className="sticky top-0 bg-zinc-50/80 backdrop-blur-xl z-20 shadow-sm">
                <tr className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                  <th className="p-6 pl-10 border-b border-black/5 w-10">Select</th>
                  <th className="p-6 pl-10 border-b border-black/5">Order ID</th>
                  <th className="p-6 border-b border-black/5">Customer</th>
                  <th className="p-6 border-b border-black/5 text-center">Status</th>
                  <th className="p-6 border-b border-black/5">Amount</th>
                  <th className="p-6 pr-10 border-b border-black/5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {paginatedOrders.map((o) => (
                  <motion.tr 
                    layoutId={o.id}
                    key={o.id} 
                    className={`transition-all cursor-pointer group ${selectedIds.includes(o.id) ? 'bg-zinc-50 shadow-inner' : 'hover:bg-zinc-50/50'}`}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="p-6 pl-10">
                      <button 
                        onClick={(e) => toggleSelection(e, o.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          selectedIds.includes(o.id) 
                          ? 'bg-zinc-950 border-zinc-950 text-white' 
                          : 'border-black/10 text-transparent hover:border-zinc-950'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-5 pl-10">
                       <span className="text-[10px] font-black text-zinc-400 font-mono tracking-tighter">#{o.orderId}</span>
                       <p className="text-[9px] font-black text-zinc-300 uppercase mt-1 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(o.timestamp).toLocaleDateString()}
                       </p>
                    </td>
                    <td className="p-5">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-zinc-950 font-bold text-lg shadow-sm border border-black/5">
                             {o.customer?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-950">{o.customer?.name || 'Vortex User'}</p>
                            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                               <MapPin className="w-2.5 h-2.5" />
                               {o.customer?.phone}
                            </span>
                          </div>
                       </div>
                    </td>
                    <td className="p-5 text-center relative">
                       <div className="flex items-center justify-center gap-2 group/status">
                          <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
                             o.status === 'delivered' ? 'bg-black/5 text-zinc-400 border-black/5' :
                             o.status === 'canceled' ? 'bg-red-500/5 text-red-500 border-red-500/10' :
                             'bg-amber-500/5 text-amber-500 border-amber-500/10'
                          }`}>
                             {o.status || 'pending'}
                          </span>
                       </div>
                    </td>
                    <td className="p-5">
                       <p className="text-sm font-black text-zinc-950">৳ {o.totals?.total?.toLocaleString()}</p>
                       {o.totals?.due > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                             <span className="text-[9px] font-black text-red-500 uppercase tracking-tight">Due: ৳{o.totals.due.toLocaleString()}</span>
                          </div>
                       )}
                    </td>
                    <td className="p-5 pr-10 text-right">
                       <button className="p-3 bg-black/5 text-zinc-950 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all hover:bg-zinc-950 hover:text-white shadow-md">
                          <Eye className="w-4 h-4" />
                       </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Smart Card Interface (Mobile) */}
            <div className="md:hidden space-y-4 p-4 pb-32">
               {paginatedOrders.map((o) => (
                  <motion.div 
                    layoutId={`mobile-${o.id}`}
                    key={`mobile-${o.id}`}
                    onClick={() => setSelectedOrder(o)}
                    className={`relative p-5 rounded-[2.5rem] border transition-all active:scale-[0.97] overflow-hidden group shadow-xl bg-white border-black/5 ${
                      o.isUrgent 
                      ? 'outline outline-4 outline-red-500/5' 
                      : ''
                    }`}
                  >
                     {o.isUrgent && (
                        <div className="absolute top-0 right-0 p-2">
                           <div className="bg-red-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">Urgent</div>
                        </div>
                     )}

                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                           <div 
                             onClick={(e) => { e.stopPropagation(); toggleSelection(e, o.id); }}
                             className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
                               selectedIds.includes(o.id) ? 'bg-zinc-950 border-zinc-950 text-white' : 'bg-black/5 border-black/10 text-zinc-950'
                             }`}
                           >
                              {selectedIds.includes(o.id) ? <CheckSquare className="w-5 h-5" /> : <span className="font-black text-xs">{o.customer?.name?.[0]}</span>}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] font-mono">#{o.orderId}</p>
                              <p className="text-base font-black text-zinc-950 tracking-tight">{o.customer?.name}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${
                              o.status === 'delivered' ? 'bg-black/5 text-zinc-400 border-black/5' :
                              o.status === 'canceled' ? 'bg-red-500/5 text-red-500 border-red-500/10' :
                              'bg-amber-500/5 text-amber-500 border-amber-500/10'
                           }`}>
                              {o.status || 'pending'}
                           </span>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 py-4 border-y border-black/5 mb-4">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-zinc-400">
                              <Calendar className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest">Order Life</p>
                              <p className="text-[10px] font-black text-zinc-950">{new Date(o.timestamp).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-zinc-400">
                              <MapPin className="w-4 h-4" />
                           </div>
                           <div className="truncate pr-2">
                              <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest">Location</p>
                              <p className="text-[10px] font-black text-zinc-950 truncate">{o.customer?.phone}</p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           {o.totals?.due > 0 ? (
                              <div className="bg-red-500/5 px-2 py-1 rounded-lg flex items-center gap-1.5 text-red-500 border border-red-500/5">
                                 <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                 <span className="text-[8px] font-black uppercase">Due Detected</span>
                              </div>
                           ) : (
                              <div className="bg-black/5 px-2 py-1 rounded-lg flex items-center gap-1.5 text-zinc-400 border border-black/5">
                                 <CheckCircle2 className="w-2.5 h-2.5" />
                                 <span className="text-[8px] font-black uppercase">Settled</span>
                              </div>
                           )}
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-zinc-950 tracking-tighter leading-none">৳ {o.totals?.total?.toLocaleString()}</p>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-20 space-y-10">
            <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center border border-black/5 shadow-2xl backdrop-blur-3xl">
              <ShoppingBag className="w-10 h-10 text-zinc-200" />
            </div>
            <div className="text-center space-y-4">
               <p className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">No Data Detected</p>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] max-w-xs leading-relaxed">The secure archive is currently empty or filtering logic returned null.</p>
            </div>
          </div>
         )}
      </div>
      {/* Flat Navigation Hub */}
      <div className="mt-auto py-8 px-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border border-black/5 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.1)]" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
            Archive Page <span className="text-zinc-950 ml-2">{currentPage}</span> <span className="mx-2 text-zinc-200">/</span> {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 justify-center">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-zinc-950 disabled:opacity-0 transition-all px-6"
          >
            ← Back
          </button>
          
          <div className="flex items-center gap-2 shrink-0 px-4">
             {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5 && pageNum > 2 && pageNum < totalPages - 1 && Math.abs(pageNum - currentPage) > 1) {
                    if (pageNum === 3 || pageNum === totalPages - 1) return <span key={pageNum} className="text-zinc-200 font-bold px-2">..</span>;
                    return null;
                }
                return (
                   <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`shrink-0 h-10 px-4 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === pageNum 
                      ? 'bg-zinc-950 text-white shadow-2xl scale-110 z-10' 
                      : 'text-zinc-400 hover:text-zinc-950 hover:bg-black/5'
                    }`}
                   >
                      {pageNum}
                   </button>
                );
             })}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-10 py-4 rounded-2xl bg-zinc-950 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl disabled:opacity-0"
          >
            Next Step →
          </button>
        </div>
      </div>
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
