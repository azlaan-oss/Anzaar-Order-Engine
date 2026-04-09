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
    { label: 'Gross Volume', value: stats.gross, icon: TrendingUp, color: 'text-emerald-900', bg: 'bg-emerald-50' },
    { label: 'Net Collected', value: stats.net, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Due', value: stats.due, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col gap-6">
      
      {/* Engineered Filter Hub - Detached from Header */}
      <div className="flex flex-col gap-4 mt-6 md:mt-0">
        {/* Layer 1: Search & Filter Matrix */}
        <div className="flex flex-col gap-3 px-4 md:px-0">
           <div className="bg-emerald-950 p-0.5 rounded-xl flex items-center px-4 gap-3 shadow-xl border border-emerald-900/50">
              <Search className="text-emerald-500 w-3 h-3" />
              <input 
               type="text" 
               placeholder="SEARCH ORDERS..." 
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="bg-transparent border-none text-white text-[10px] font-bold w-full focus:outline-none placeholder:text-white/20 h-8"
              />
           </div>

           <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-gray-100 shadow-sm text-emerald-950 overflow-hidden">
                <Calendar className="w-3.5 h-3.5 ml-2 text-emerald-500 shrink-0" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => {
                      setStartDate(e.target.value);
                      setDateFilter('range');
                  }}
                  className="bg-transparent border-none text-[8px] font-bold outline-none cursor-pointer p-1 uppercase w-full"
                />
                <span className="text-gray-300">/</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => {
                      setEndDate(e.target.value);
                      setDateFilter('range');
                  }}
                  className="bg-transparent border-none text-[8px] font-bold outline-none cursor-pointer p-1 uppercase w-full"
                />
              </div>

              <button 
                onClick={() => setIsUrgentOnly(!isUrgentOnly)}
                className={`flex items-center gap-2 px-4 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                   isUrgentOnly 
                   ? 'bg-red-500 text-white border-red-400 shadow-lg' 
                   : 'bg-white/50 text-red-500 border-red-100'
                }`}
              >
                 <AlertCircle className="w-4 h-4" />
                 <span className="hidden xs:inline">Urgent</span>
              </button>
           </div>
        </div>

        {/* Layer 2: Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-0 px-4 md:px-0">
           <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar flex-nowrap min-w-0 w-full md:w-auto">
              {['all', 'today', 'yesterday', '7days', '30days'].map((d) => (
                 <button
                    key={d}
                    onClick={() => {
                        setDateFilter(d);
                        setStartDate('');
                        setEndDate('');
                    }}
                    className={`px-4 md:px-5 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                       dateFilter === d && !startDate 
                       ? 'bg-emerald-950 text-white shadow-md' 
                       : 'text-emerald-950/40 hover:text-emerald-950'
                    }`}
                 >
                    {d === 'all' ? 'All Orders' : d === '30days' ? 'Month' : d}
                 </button>
              ))}
           </div>
           
           <div className="hidden md:block text-[9px] font-bold text-emerald-950/20 uppercase tracking-[0.3em] pr-2">
              {filteredOrders.length} Total Protocols
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
              className="bg-emerald-950 rounded-3xl p-4 flex items-center justify-between shadow-2xl shadow-emerald-950/40 overflow-hidden"
            >
              <div className="flex items-center gap-6 px-4">
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{selectedIds.length} Orders Selected</span>
                 <div className="h-4 w-px bg-emerald-800" />
                 <button onClick={() => setSelectedIds([])} className="text-[10px] font-black text-gray-400 uppercase hover:text-white transition-colors">Clear Selection</button>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={handleBulkPrint}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5"
                 >
                   <Printer className="w-3.5 h-3.5 text-emerald-400" />
                   Batch Print
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[3rem] shadow-2xl border border-white/60 overflow-hidden relative flex flex-col">
        {loading ? (
          <div className="p-8 space-y-4">
             {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-6 animate-pulse">
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl" />
                   <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-50 rounded-md w-1/4" />
                      <div className="h-4 bg-gray-50 rounded-md w-1/2" />
                   </div>
                   <div className="w-24 h-8 bg-gray-50 rounded-xl" />
                </div>
             ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0 hidden md:table">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-20 shadow-sm">
                <tr className="text-[10px] uppercase font-black tracking-widest text-emerald-900/40">
                  <th className="p-6 pl-10 border-b border-emerald-50 w-10">Select</th>
                  <th className="p-6 pl-10 border-b border-emerald-50">Order ID</th>
                  <th className="p-6 border-b border-emerald-50">Customer</th>
                  <th className="p-6 border-b border-emerald-50 text-center">Status</th>
                  <th className="p-6 border-b border-emerald-50">Amount</th>
                  <th className="p-6 pr-10 border-b border-emerald-50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50">
                {paginatedOrders.map((o) => (
                  <motion.tr 
                    layoutId={o.id}
                    key={o.id} 
                    className={`transition-all cursor-pointer group ${selectedIds.includes(o.id) ? 'bg-emerald-50/80 shadow-inner' : 'hover:bg-emerald-50/40'}`}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td className="p-6 pl-10">
                      <button 
                        onClick={(e) => toggleSelection(e, o.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          selectedIds.includes(o.id) 
                          ? 'bg-emerald-950 border-emerald-950 text-white' 
                          : 'border-emerald-100 text-transparent hover:border-emerald-950'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-5 pl-10">
                       <span className="text-[10px] font-black text-emerald-900/30 font-mono tracking-tighter">#{o.orderId}</span>
                       <p className="text-[9px] font-black text-gray-400 uppercase mt-1 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(o.timestamp).toLocaleDateString()}
                       </p>
                    </td>
                    <td className="p-5">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-900 font-serif font-black text-lg shadow-sm border border-emerald-100">
                             {o.customer?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-emerald-950">{o.customer?.name || 'Vortex User'}</p>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                               <MapPin className="w-2.5 h-2.5" />
                               {o.customer?.phone}
                            </span>
                          </div>
                       </div>
                    </td>
                    <td className="p-5 text-center relative">
                       <div className="flex items-center justify-center gap-2 group/status">
                          <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-all shadow-sm ${
                             o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                             o.status === 'canceled' ? 'bg-red-50 text-red-600 border-red-100' :
                             'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                             {o.status || 'pending'}
                          </span>
                          
                       </div>
                    </td>
                    <td className="p-5">
                       <p className="text-sm font-black text-emerald-950">৳ {o.totals?.total?.toLocaleString()}</p>
                       {o.totals?.due > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                             <span className="text-[9px] font-black text-red-500 uppercase tracking-tight">Due: ৳{o.totals.due.toLocaleString()}</span>
                          </div>
                       )}
                    </td>
                    <td className="p-5 pr-10 text-right">
                       <button className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all hover:bg-emerald-900 hover:text-white shadow-md">
                          <Eye className="w-4 h-4" />
                       </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Smart Card Interface (Mobile) */}
            <div className="md:hidden space-y-4 p-4">
               {paginatedOrders.map((o) => (
                  <motion.div 
                    layoutId={`mobile-${o.id}`}
                    key={`mobile-${o.id}`}
                    onClick={() => setSelectedOrder(o)}
                    className="glass-card !bg-white p-5 rounded-[2rem] border border-emerald-50 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group"
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                           <div 
                             onClick={(e) => { e.stopPropagation(); toggleSelection(e, o.id); }}
                             className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                               selectedIds.includes(o.id) ? 'bg-emerald-950 border-emerald-950 text-white' : 'border-emerald-100'
                             }`}
                           >
                              {selectedIds.includes(o.id) && <CheckSquare className="w-3.5 h-3.5" />}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em] font-mono">#{o.orderId}</p>
                              <p className="text-sm font-black text-emerald-950 mt-0.5">{o.customer?.name}</p>
                           </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                           o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                           o.status === 'canceled' ? 'bg-red-50 text-red-600' :
                           'bg-amber-50 text-amber-600'
                        }`}>
                           {o.status || 'pending'}
                        </span>
                     </div>
                     
                     <div className="h-px bg-emerald-50/50 w-full mb-4" />
                     
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 uppercase">
                              <Calendar className="w-3 h-3" />
                              {new Date(o.timestamp).toLocaleDateString()}
                           </p>
                           <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 uppercase">
                              <Phone className="w-3 h-3" />
                              {o.customer?.phone}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-black text-emerald-950 leading-none">৳ {o.totals?.total?.toLocaleString()}</p>
                           {o.totals?.due > 0 && <p className="text-[8px] font-black text-red-500 uppercase mt-1 tracking-tighter">Due: ৳{o.totals.due}</p>}
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-20 space-y-6">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shadow-inner">
              <ShoppingBag className="w-10 h-10 text-emerald-900/20" />
            </div>
            <div className="text-center">
               <p className="text-xl font-serif font-black text-emerald-950">No Data Detected</p>
               <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">The secure archive is currently empty or filtering logic returned null.</p>
            </div>
          </div>
        )}
      </div>
      {/* Flat Navigation Hub */}
      <div className="mt-auto py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-950/30 uppercase tracking-[0.4em]">
            Page <span className="text-emerald-950 ml-1">{currentPage}</span> / {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-center">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-[10px] font-black uppercase tracking-widest text-emerald-950/20 hover:text-emerald-950 disabled:opacity-5 transition-all px-2"
          >
            Back
          </button>
          
          <div className="flex items-center gap-1 shrink-0">
             {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5 && pageNum > 2 && pageNum < totalPages - 1 && Math.abs(pageNum - currentPage) > 1) {
                    if (pageNum === 3 || pageNum === totalPages - 1) return <span key={pageNum} className="text-emerald-900/5 font-bold">..</span>;
                    return null;
                }
                return (
                   <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`shrink-0 h-7 px-3 rounded-lg text-[9px] font-black transition-all ${
                      currentPage === pageNum 
                      ? 'bg-emerald-950 text-white shadow-lg' 
                      : 'text-emerald-950/10 hover:text-emerald-950'
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
            className="px-6 py-2 rounded-xl bg-emerald-950 text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
          >
            Next →
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
