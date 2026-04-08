"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  ArrowLeft, 
  Package, 
  CreditCard,
  Target,
  Sparkles,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('current'); // 'current', 'last', 'all'

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Reports Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastYear = lastMonthDate.getFullYear();

    // Helper: Filter by month/year
    const filterByMonth = (month, year) => orders.filter(o => {
      const d = new Date(o.timestamp);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const currentOrders = timeframe === 'all' ? orders : 
                          timeframe === 'last' ? filterByMonth(lastMonth, lastYear) : 
                          filterByMonth(currentMonth, currentYear);
    
    const prevOrders = timeframe === 'current' ? filterByMonth(lastMonth, lastYear) : [];

    // Calculations
    const getRevenue = (arr) => arr.reduce((sum, o) => sum + (o.totals?.total || 0), 0);
    const rev = getRevenue(currentOrders);
    const prevRev = getRevenue(prevOrders);
    
    const count = currentOrders.length;
    const prevCount = prevOrders.length;

    // Growth %
    const calculateGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const revGrowth = calculateGrowth(rev, prevRev);
    const countGrowth = calculateGrowth(count, prevCount);

    // Customer Loyalty (Repeat Customers)
    const phoneMap = {};
    currentOrders.forEach(o => {
      const p = o.customer.phone;
      phoneMap[p] = (phoneMap[p] || 0) + 1;
    });
    const repeatCustomers = Object.values(phoneMap).filter(c => c > 1).length;
    const loyaltyRate = count > 0 ? (repeatCustomers / count) * 100 : 0;

    // Daily Revenue Map (Current View)
    const dailyMap = {};
    currentOrders.forEach(o => {
      const day = new Date(o.timestamp).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + (o.totals?.total || 0);
    });
    
    // Sort daily data for chart
    const dailyData = Object.entries(dailyMap)
      .map(([day, val]) => ({ day: parseInt(day), val }))
      .sort((a, b) => a.day - b.day);

    // Product Performance
    const productSales = {};
    currentOrders.forEach(o => {
      o.items.forEach(i => {
        productSales[i.name] = (productSales[i.name] || 0) + (i.price * i.quantity);
      });
    });
    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Payment Mix
    const payments = currentOrders.reduce((acc, o) => {
      const m = o.payment.method;
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    return { 
      rev, prevRev, revGrowth,
      count, prevCount, countGrowth,
      loyaltyRate, repeatCustomers,
      dailyData, topProducts, payments
    };
  }, [orders, timeframe]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white overflow-hidden relative">
       <div className="absolute top-0 left-0 w-full h-1 bg-emerald-950/5 overflow-hidden">
          <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-1/2 h-full bg-emerald-950" />
       </div>
       <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-emerald-950 mx-auto animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-950/40">Initializing High-Fidelity Intelligence Vault</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-emerald-950 selection:text-white pb-32">
      
      {/* Dynamic Header & Floating Controller */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-xl bg-white/80">
         <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <Link href="/" className="p-2.5 hover:bg-emerald-50 rounded-2xl text-emerald-950 transition-all border border-transparent hover:border-emerald-100">
                  <ArrowLeft className="w-5 h-5" />
               </Link>
               <div>
                  <h1 className="text-xl font-serif font-black text-emerald-950 tracking-tighter">Performance Vault</h1>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-950/30">System Telemetry v2.0 • Active Mode</p>
               </div>
            </div>

            <div className="flex items-center bg-gray-100/80 p-1.5 rounded-[2rem] border border-gray-200/50 shadow-inner">
               {[
                 { id: 'current', label: 'This Month' },
                 { id: 'last', label: 'Previous' },
                 { id: 'all', label: 'All Time' }
               ].map((opt) => (
                 <button
                   key={opt.id}
                   onClick={() => setTimeframe(opt.id)}
                   className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                     timeframe === opt.id ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-950/20' : 'text-gray-400 hover:text-emerald-950'
                   }`}
                 >
                   {opt.label}
                 </button>
               ))}
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
         
         {/* Live Performance Indicators */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Gross Revenue', value: `৳${stats.rev.toLocaleString()}`, growth: stats.revGrowth, icon: TrendingUp },
              { label: 'Transaction Vol', value: stats.count, growth: stats.countGrowth, icon: Activity },
              { label: 'Loyalty Rate', value: `${stats.loyaltyRate.toFixed(1)}%`, sub: `${stats.repeatCustomers} Repeat Users`, icon: Users },
              { label: 'Avg Ticket Size', value: `৳${Math.round(stats.rev / (stats.count || 1)).toLocaleString()}`, icon: Target }
            ].map((stat, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden"
              >
                 <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                    <div className="flex items-center justify-between">
                       <div className="w-10 h-10 bg-emerald-50 text-emerald-950 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <stat.icon className="w-5 h-5" />
                       </div>
                       {stat.growth !== undefined && timeframe === 'current' && (
                         <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black ${
                           stat.growth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                         }`}>
                            {stat.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(stat.growth).toFixed(1)}%
                         </div>
                       )}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</p>
                       <h2 className="text-3xl font-serif font-black text-emerald-950 tracking-tighter">{stat.value}</h2>
                       {stat.sub && <p className="text-[9px] font-bold text-emerald-950/40 mt-1 uppercase tracking-wider">{stat.sub}</p>}
                    </div>
                 </div>
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
              </motion.div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Daily Intelligence Heatmap */}
            <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="text-2xl font-serif font-black text-emerald-950 uppercase tracking-tight">Financial Pulse</h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Revenue Velocity Matrix</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                     <span className="text-[9px] font-black text-emerald-950/30 uppercase tracking-widest">Live Telemetry</span>
                  </div>
               </div>

               <div className="h-[300px] flex items-end gap-2 px-2">
                  {timeframe !== 'all' ? (
                    stats.dailyData.length > 0 ? (
                      Array.from({ length: 31 }, (_, i) => {
                         const day = i + 1;
                         const data = stats.dailyData.find(d => d.day === day);
                         const maxVal = Math.max(...stats.dailyData.map(d => d.val), 1);
                         const height = data ? (data.val / maxVal) * 100 : 2;
                         
                         return (
                           <div key={i} className="group relative flex-1 h-full flex flex-col justify-end">
                              <motion.div 
                                initial={{ height: 0 }} 
                                animate={{ height: `${height}%` }}
                                className={`rounded-t-lg transition-all duration-500 ${
                                  data ? 'bg-emerald-950 group-hover:bg-gold-500 shadow-lg' : 'bg-gray-50'
                                }`}
                              />
                              {data && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                   <div className="bg-emerald-950 text-white px-3 py-2 rounded-xl text-[10px] font-black shadow-2xl whitespace-nowrap">
                                      ৳{data.val.toLocaleString()}
                                   </div>
                                   <div className="w-2 h-2 bg-emerald-950 rotate-45 mx-auto -mt-1" />
                                </div>
                              )}
                              <span className="text-[7px] font-black text-gray-300 mt-2 text-center uppercase group-hover:text-emerald-950 transition-colors">
                                 {day}
                              </span>
                           </div>
                         );
                      })
                    ) : (
                      <div className="w-full flex items-center justify-center text-gray-300 font-serif italic">Zero Transactions Recorded</div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time-series restricted to Monthly view</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Asset Distribution (Category/Method Pie) */}
            <div className="lg:col-span-4 space-y-8">
               
               {/* Revenue Share Visual */}
               <div className="bg-emerald-950 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center group">
                  <div className="relative z-10 space-y-6">
                     <div className="w-32 h-32 rounded-full border-8 border-gold-400/20 border-t-gold-400 animate-[spin_10s_linear_infinite] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PieChart className="w-10 h-10 text-gold-400 rotate-[-45deg]" />
                     </div>
                     <div>
                        <h4 className="text-xl font-serif font-black tracking-tight uppercase">Demand Matrix</h4>
                        <p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-[0.3em] mt-1">High-Entropy Product Split</p>
                     </div>
                  </div>
                  
                  {/* Background Orbs */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/20 rounded-full blur-[80px]" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-800/40 rounded-full blur-[80px]" />
               </div>

               {/* Top Performers Mini-Grid */}
               <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                     <h3 className="text-xs font-black text-emerald-950 uppercase tracking-widest">Velocity Peaks</h3>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="space-y-4">
                     {stats.topProducts.map(([name, revenue], i) => (
                        <div key={i} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gray-300">{i+1}</span>
                              <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider truncate max-w-[100px]">{name}</span>
                           </div>
                           <span className="text-[11px] font-black text-emerald-900">৳{revenue.toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>

            </div>

         </div>

         {/* Bottom Action Bar */}
         <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-2xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Last Intelligence Sync</p>
                  <p className="text-xs font-black text-emerald-950">{new Date().toLocaleTimeString()} • Secured Connection</p>
               </div>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-950 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-950/20 active:scale-95"
            >
               <Sparkles className="w-4 h-4 text-gold-400" />
               Download Analytical Report
            </button>
         </div>

      </div>
    </div>
  );
}
