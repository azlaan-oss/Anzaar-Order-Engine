"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  ChevronRight,
  ChevronLeft,
  Calendar, 
  Filter,
  Layers,
  Zap,
  PlusCircle,
  Search,
  History as HistoryIcon,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import OrderDetailModal from '../components/OrderDetailModal';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  const [liveLogs, setLiveLogs] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('timestamp', 'desc'));
        const orderSnap = await getDocs(q);
        const ordersList = [];
        orderSnap.forEach(doc => ordersList.push({ id: doc.id, ...doc.data() }));
        setAllOrders(ordersList);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

    // Live Activity Listener
    const logsQ = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(20));
    const unsubscribe = onSnapshot(logsQ, (snap) => {
      const logs = [];
      snap.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setLiveLogs(logs);
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async (order) => {
    const toastId = toast.loading(`Syncing #${order.orderId} to Sheets...`);
    try {
      // 1. Get Settings
      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      const settings = settingsSnap.data();

      // 2. Trigger Sync
      const res = await fetch('/api/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...order, 
          sheetId: settings?.activeSheetId,
          sheetTab: settings?.activeSheetTab || 'Sheet1'
        })
      });
      
      if (res.ok) {
        await updateDoc(doc(db, "orders", order.id), { syncStatus: 'synced' });
        toast.success("Synced successfully!", { id: toastId });
        // Refresh local data
        setAllOrders(prev => prev.map(o => o.id === order.id ? {...o, syncStatus: 'synced'} : o));
      } else {
        const err = await res.text();
        toast.error(`Sync Failed: ${err}`, { id: toastId });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  // Filtering Logic
  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - (24 * 60 * 60 * 1000);
    const last7Days = today - (7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const data = allOrders.filter(order => {
      const orderTime = new Date(order.timestamp).getTime();
      if (timeFilter === 'today') return orderTime >= today;
      if (timeFilter === 'yesterday') return orderTime >= yesterday && orderTime < today;
      if (timeFilter === '7days') return orderTime >= last7Days;
      if (timeFilter === 'month') return orderTime >= thisMonth;
      if (timeFilter === 'custom' && customRange.start && customRange.end) {
        const start = new Date(customRange.start).getTime();
        const end = new Date(customRange.end).setHours(23,59,59,999);
        return orderTime >= start && orderTime <= end;
      }
      return true; // all
    });
    
    setCurrentPage(1); // Reset page on filter change
    return data;
  }, [allOrders, timeFilter, customRange]);

  // Pagination Slicing
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Analytics Calculation
  const stats = useMemo(() => {
    let gross = 0;
    let netCash = 0;
    let due = 0;
    let itemsSold = 0;

    filteredData.forEach(order => {
      gross += order.totals?.total || 0;
      due += order.totals?.due || 0;
      netCash += (order.totals?.total - order.totals?.due) || 0;
      itemsSold += order.items?.length || 0;
    });

    return { gross, netCash, due, itemsSold, count: filteredData.length };
  }, [filteredData]);

  const metricCards = [
    { title: 'Gross Revenue', value: `৳ ${stats.gross.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-900', bg: 'bg-emerald-50' },
    { title: 'Net Cash In', value: `৳ ${stats.netCash.toLocaleString()}`, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Receivable', value: `৳ ${stats.due.toLocaleString()}`, icon: Layers, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Items Sold', value: stats.itemsSold, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 px-4 sm:px-6">
      
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-950 text-gold-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold-400/20 shadow-lg">
                Pro Engine v3.0
             </div>
             <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Live Sync
             </motion.div>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-emerald-950 tracking-tighter">Business Console</h1>
        </div>
        
        {/* Advanced Filter UI */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden min-w-fit max-w-full">
           {['today', 'yesterday', '7days', 'month', 'custom', 'all'].map((f) => (
             <button 
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                timeFilter === f ? 'bg-emerald-900 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-900'
              }`}
             >
               {f === '7days' ? '7 Days' : f}
             </button>
           ))}
           {timeFilter === 'custom' && (
             <div className="flex gap-2 pl-2 sm:pl-4 border-l border-gray-100 mt-2 sm:mt-0">
               <input 
                type="date" 
                value={customRange.start}
                onChange={e => setCustomRange({...customRange, start: e.target.value})}
                className="text-[9px] font-bold bg-gray-50 p-1.5 rounded-lg outline-none w-24 sm:w-auto"
               />
               <input 
                type="date" 
                value={customRange.end}
                onChange={e => setCustomRange({...customRange, end: e.target.value})}
                className="text-[9px] font-bold bg-gray-50 p-1.5 rounded-lg outline-none w-24 sm:w-auto"
               />
             </div>
           )}
        </div>
      </header>

      {/* Metric Grid - Responsive Stacking */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-28 md:h-32 bg-gray-50 rounded-3xl animate-pulse" />)
        ) : (
          metricCards.map((card, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div className={`${card.bg} ${card.color} w-8 md:w-10 h-8 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-4`}>
                <card.icon className="w-4 md:w-5 h-4 md:h-5" />
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-black text-emerald-950 tracking-tight">{card.value}</h3>
                <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{card.title}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Main Intelligent Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        
        {/* Activity Archive with Pagination */}
        <div className="lg:col-span-8 flex flex-col space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
               <Calendar className="w-5 md:w-6 h-5 md:h-6 text-emerald-950" />
               <h2 className="text-xl md:text-2xl font-serif font-black text-emerald-950">Activity Archive</h2>
             </div>
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-500 border border-gray-100">
                <Filter className="w-3 h-3" />
                Filtered: <span className="text-emerald-900">{stats.count}</span>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden flex-1 flex flex-col min-h-[600px]">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl" />)}
              </div>
            ) : paginatedData.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-20 text-gray-300">
                  <Zap className="w-12 h-12 opacity-20 mb-4" />
                  <p className="text-sm font-medium">No results recorded today.</p>
               </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50 flex-1">
                  {paginatedData.map((order, idx) => (
                    <motion.div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="p-5 md:p-6 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 md:gap-5">
                         <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg font-black text-emerald-950 group-hover:scale-105 transition-transform">
                            {order.customer?.name?.[0].toUpperCase() || '#'}
                         </div>
                         <div>
                            <h4 className="font-bold text-emerald-950 text-sm md:text-base leading-none mb-1">{order.customer?.name}</h4>
                            <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                               <span>#{order.orderId}</span>
                               <span className="w-1 h-1 rounded-full bg-gray-200" />
                               <span>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                         </div>
                      </div>

                       <div className="flex items-center gap-4 md:gap-8">
                          <div className="flex flex-col items-end gap-1">
                             {order.syncStatus !== 'synced' && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleManualSync(order); }}
                                className="px-2 py-0.5 bg-red-50 text-red-500 text-[8px] font-bold rounded-md hover:bg-red-100 transition-colors flex items-center gap-1"
                               >
                                 <RefreshCw className="w-2 h-2" />
                                 Sync Missed
                               </button>
                             )}
                             <p className="text-sm md:text-lg font-black text-emerald-950 leading-none">৳ {order.totals?.total}</p>
                             {order.totals?.due > 0 ? (
                               <p className="text-[8px] md:text-[9px] font-bold text-amber-600 uppercase">Due ৳{order.totals.due}</p>
                             ) : (
                               <p className="text-[8px] md:text-[9px] font-bold text-emerald-500 uppercase">Paid</p>
                             )}
                          </div>
                          <ArrowRight className="w-4 md:w-5 h-4 md:h-5 text-gray-200 group-hover:text-emerald-950 transition-colors" />
                       </div>
                    </motion.div>
                  ))}
                </div>

                {/* Intelligent Pagination Controls */}
                <div className="p-4 md:p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Page {currentPage} of {totalPages || 1}
                   </p>
                   <div className="flex gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 md:p-3 bg-white border border-gray-200 rounded-xl hover:bg-emerald-50 disabled:opacity-30 transition-all"
                      >
                         <ChevronLeft className="w-4 md:w-5 h-4 md:h-5 text-emerald-900" />
                      </button>
                      <button 
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 md:p-3 bg-white border border-gray-200 rounded-xl hover:bg-emerald-50 disabled:opacity-30 transition-all"
                      >
                         <ChevronRight className="w-4 md:w-5 h-4 md:h-5 text-emerald-900" />
                      </button>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Engine Feed */}
        <div className="lg:col-span-4 flex flex-col space-y-4 md:space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <HistoryIcon className="w-5 md:w-6 h-5 md:h-6 text-emerald-900" />
                 <h2 className="text-xl md:text-2xl font-serif font-black text-emerald-950 uppercase">Live Engine</h2>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           </div>

           <div className="bg-emerald-950/95 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex-1 flex flex-col overflow-hidden min-h-[400px]">
              <div className="space-y-4 overflow-y-auto custom-scrollbar-dark flex-1 pr-2">
                 <AnimatePresence mode="popLayout">
                    {liveLogs.map((log) => (
                      <motion.div 
                        key={log.id} 
                        layout
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-1 relative group hover:bg-white/10 transition-colors"
                      >
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black text-gold-400 uppercase tracking-tight">{log.action}</p>
                            <span className="text-[8px] font-medium text-white/30 italic">
                               {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Syncing...'}
                            </span>
                         </div>
                         <p className="text-[9px] font-bold text-emerald-50 uppercase tracking-widest">{log.user}</p>
                         {log.details?.total && <p className="text-[10px] font-black text-white pt-1">৳ {log.details.total}</p>}
                      </motion.div>
                    ))}
                 </AnimatePresence>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Global Telemetry Active</span>
              </div>
           </div>
        </div>

      </div>

      {/* Order Detail Intelligence Popup */}
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
