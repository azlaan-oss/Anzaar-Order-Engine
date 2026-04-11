"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  ChevronRight,
  ChevronLeft,
  Calendar, 
  Layers,
  Zap,
  PlusCircle,
  Package,
  ClipboardList,
  AlertCircle,
  ArrowRight,
  BarChart3,
  UserCheck,
  Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import OrderDetailModal from '../components/OrderDetailModal';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today'); 
  const [liveLogs, setLiveLogs] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  useEffect(() => {
    // OPTIMIZED: Added limit(100) to keep dashboard snappy
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
      const ordersList = [];
      snap.forEach(doc => ordersList.push({ id: doc.id, ...doc.data() }));
      setAllOrders(ordersList);
      setLoading(false);
    });

    const unsubLogs = onSnapshot(query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(20)), (snap) => {
      const logs = [];
      snap.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setLiveLogs(logs);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const pList = [];
      snap.forEach(doc => pList.push({ id: doc.id, ...doc.data() }));
      setProducts(pList);
    });

    return () => { unsubOrders(); unsubLogs(); unsubProducts(); };
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - (24 * 60 * 60 * 1000);
    const last7Days = today - (7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return allOrders.filter(order => {
      const orderTime = new Date(order.timestamp).getTime();
      if (timeFilter === 'today') return orderTime >= today;
      if (timeFilter === 'yesterday') return orderTime >= yesterday && orderTime < today;
      if (timeFilter === '7days') return orderTime >= last7Days;
      if (timeFilter === 'month') return orderTime >= thisMonth;
      return true;
    });
  }, [allOrders, timeFilter]);

  const radar = useMemo(() => {
    const pendingOrders = allOrders.filter(o => o.status === 'Pending').length;
    const lowStock = products.filter(p => p.variants?.some(v => v.stock < 5)).length;
    const deliveryRate = allOrders.length > 0 ? Math.round((allOrders.filter(o => o.status === 'Delivered').length / allOrders.length) * 100) : 0;
    return { pendingOrders, lowStock, deliveryRate };
  }, [allOrders, products]);

  const stats = useMemo(() => {
    let gross = 0, netCash = 0, due = 0, itemsSold = 0;
    filteredData.forEach(order => {
      gross += order.totals?.total || 0;
      due += order.totals?.due || 0;
      netCash += (order.totals?.total - (order.totals?.due || 0)) || 0;
      itemsSold += order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
    });
    return { gross, netCash, due, itemsSold };
  }, [filteredData]);

  const quickActions = [
    { name: 'New Order', icon: PlusCircle, path: '/orders/new', color: 'bg-zinc-50 text-zinc-900' },
    { name: 'Inventory', icon: Package, path: '/admin/products', color: 'bg-white text-gray-400' },
    { name: 'All Orders', icon: ClipboardList, path: '/admin/orders', color: 'bg-white text-gray-400' },
    { name: 'Reports', icon: BarChart3, path: '/admin/reports', color: 'bg-white text-gray-400' },
  ];

  if (loading && allOrders.length === 0) return null; // Defer to global root loading.js skeleton

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 pb-20 px-4 md:px-10">
      
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-zinc-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-950/10">
                 Pro Engine v3.0
              </div>
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-950 text-[9px] font-black uppercase tracking-widest">Live Sync</span>
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-950 tracking-tight">Business Console</h1>
        </div>
        
        <div className="flex items-center bg-white p-1.5 rounded-full border border-black/5 shadow-xl min-w-fit">
           {['today', 'yesterday', '7days', 'month', 'all'].map((f) => (
             <button 
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                timeFilter === f ? 'bg-zinc-950 text-white shadow-lg shadow-zinc-950/20' : 'text-zinc-400 hover:text-zinc-950'
              }`}
             >
               {f === '7days' ? 'Week' : f}
             </button>
           ))}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: 'Gross Revenue', value: stats.gross.toLocaleString(), icon: TrendingUp, color: 'text-zinc-950', bg: 'bg-zinc-50' },
          { title: 'Net Cash In', value: stats.netCash.toLocaleString(), icon: Zap, color: 'text-zinc-950', bg: 'bg-zinc-50' },
          { title: 'Receivable', value: stats.due.toLocaleString(), icon: Layers, color: 'text-red-500', bg: 'bg-red-50' },
          { title: 'Items Sold', value: stats.itemsSold, icon: ShoppingBag, color: 'text-zinc-950', bg: 'bg-zinc-50' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-black/5 shadow-xl flex flex-col justify-between">
            <div className={`${card.bg} ${card.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 border border-black/5 shadow-sm`}>
               <card.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-black text-zinc-950 tracking-tight leading-none">৳ {card.value}</h3>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {quickActions.map((action, i) => (
             <Link key={i} href={action.path} className="bg-white p-5 md:p-6 flex items-center justify-between group hover:bg-zinc-950 transition-all border border-black/5 !rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-4">
                   <action.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                   <span className="text-[10px] font-black text-zinc-950 group-hover:text-white uppercase tracking-widest transition-colors">{action.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-200 group-hover:text-white transition-all" />
             </Link>
          ))}
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
           {/* Radar Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               {[
                 { label: 'Pending', value: radar.pendingOrders, icon: AlertCircle, color: 'text-orange-500' },
                 { label: 'Low Stock', value: radar.lowStock, icon: Package, color: 'text-red-500' },
                 { label: 'Success Ratio', value: `${radar.deliveryRate}%`, icon: UserCheck, color: 'text-zinc-500' }
               ].map((m, i) => (
                 <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-black/5 flex items-center gap-5 shadow-xl">
                    <div className={`w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center border border-black/5 ${m.color}`}>
                       <m.icon className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-xl font-bold text-zinc-950 tracking-tight leading-none">{m.value}</h4>
                       <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mt-1">{m.label}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* Activity List */}
            <div className="bg-white rounded-[3rem] border border-black/5 shadow-xl overflow-hidden flex flex-col">
               <div className="p-8 border-b border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Calendar className="w-5 h-5 text-zinc-400" />
                     <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight">Personnel Feed</h3>
                  </div>
                  <Link href="/admin/orders" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-5 py-2.5 rounded-full hover:bg-zinc-950 hover:text-white transition-all border border-black/5">
                     Archive
                  </Link>
               </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                 {filteredData.slice(0, 10).map((order) => (
                   <div key={order.id} onClick={() => setSelectedOrder(order)} className="p-4 md:p-8 hover:bg-zinc-50 transition-all flex items-center justify-between cursor-pointer group border-b border-black/5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-base md:text-lg font-bold text-zinc-950 border border-black/5">
                          {order.customer?.name?.[0].toUpperCase() || '#'}
                       </div>
                       <div>
                          <h4 className="font-bold text-white text-sm md:text-base leading-none mb-1 truncate max-w-[120px] md:max-w-none">{order.customer?.name}</h4>
                          <p className="text-[8px] md:text-[9px] text-white/30 font-bold uppercase tracking-widest">#{order.orderId} • {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                       <div className="text-right">
                          <p className="text-base md:text-xl font-black text-white tracking-tight leading-none">৳ {order.totals?.total}</p>
                          <p className={`text-[7px] md:text-[8px] font-black uppercase mt-1 tracking-widest ${order.totals?.due > 0 ? 'text-amber-500' : 'text-white/20'}`}>{order.totals?.due > 0 ? 'Unsettled' : 'Settled'}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Live Engine Feed */}
        <div className="lg:col-span-4 h-full">
           <div className="bg-white border border-black/5 rounded-[3rem] p-8 shadow-2xl h-full flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-zinc-300" />
                    <h3 className="text-base font-bold text-zinc-950 uppercase tracking-tight">Live Engine</h3>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse outline outline-4 outline-zinc-950/10" />
              </div>
              <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                 <AnimatePresence mode="popLayout">
                    {liveLogs.map((log) => (
                      <motion.div key={log.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-zinc-50 border border-black/5 p-4 rounded-2xl">
                         <div className="flex justify-between items-start mb-1">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{log.action}</p>
                            <span className="text-[8px] font-medium text-zinc-200">{log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}</span>
                         </div>
                         <p className="text-[9px] font-bold text-zinc-950 uppercase tracking-widest truncate">{log.user}</p>
                      </motion.div>
                    ))}
                 </AnimatePresence>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
