"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  fetchOrders, 
  getProducts 
} from '../../../lib/firebase-utils';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package,
  Clock,
  CreditCard,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
  ChevronDown,
  Info,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const [o, p] = await Promise.all([fetchOrders(), getProducts()]);
        setOrders(o);
        setProducts(p);
      } catch (e) {
        console.error("Failed to load report data:", e);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const reportData = useMemo(() => {
    if (orders.length === 0) return null;

    let filtered = orders;
    const now = new Date();

    if (timeRange === 'Today') {
       const todayStr = now.toDateString();
       filtered = orders.filter(o => new Date(o.timestamp).toDateString() === todayStr);
    } else if (timeRange === 'Week') {
       const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
       filtered = orders.filter(o => new Date(o.timestamp) >= lastWeek);
    } else if (timeRange === 'Month') {
       const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
       filtered = orders.filter(o => new Date(o.timestamp) >= lastMonth);
    } else if (timeRange === 'Custom' && startDate && endDate) {
       const start = new Date(startDate);
       const end = new Date(endDate);
       end.setHours(23, 59, 59);
       filtered = orders.filter(o => {
          const d = new Date(o.timestamp);
          return d >= start && d <= end;
       });
    }

    const revenue = filtered.reduce((acc, o) => acc + (o.totals?.total || 0), 0);
    const avgOrder = filtered.length > 0 ? revenue / filtered.length : 0;
    const totalPcs = filtered.reduce((acc, o) => acc + (o.items?.reduce((iA, i) => iA + (i.quantity || 1), 0) || 0), 0);

    const statusCounts = filtered.reduce((acc, o) => {
      const s = o.status || 'Pending';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const stChart = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const successRate = filtered.length > 0 ? Math.round(((statusCounts['Delivered'] || 0) + (statusCounts['Completed'] || 0)) / filtered.length * 100) : 0;

    const dailyMap = filtered.reduce((acc, o) => {
      const date = new Date(o.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      acc[date] = (acc[date] || 0) + (o.totals?.total || 0);
      return acc;
    }, {});
    const trendData = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount })).sort((a,b) => new Date(a.date) - new Date(b.date));

    const payments = filtered.reduce((acc, o) => {
      const m = o.payment?.method || 'COD';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    const payChart = Object.entries(payments).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const topPayMethod = payChart[0]?.name || 'N/A';
    const topPayPct = filtered.length > 0 ? Math.round((payChart[0]?.value / filtered.length) * 100) : 0;

    const hours = filtered.reduce((acc, o) => {
      const h = new Date(o.timestamp).getHours();
      let slot = 'Night (12am-6am)';
      if (h >= 6 && h < 12) slot = 'Morning (6am-12pm)';
      if (h >= 12 && h < 18) slot = 'Afternoon (1pm-6pm)';
      if (h >= 18 && h <= 23) slot = 'Evening (7pm-12am)';
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {});
    const timeChart = [
      { name: 'Morning', value: hours['Morning (6am-12pm)'] || 0 },
      { name: 'Afternoon', value: hours['Afternoon (1pm-6pm)'] || 0 },
      { name: 'Evening', value: hours['Evening (7pm-12am)'] || 0 },
      { name: 'Night', value: hours['Night (12am-6am)'] || 0 },
    ].sort((a,b) => b.value - a.value);

    const productStats = filtered.reduce((acc, o) => {
      o.items?.forEach(item => {
        acc[item.name] = (acc[item.name] || 0) + (item.quantity || 1);
      });
      return acc;
    }, {});
    const topSelling = Object.entries(productStats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    return { 
      totalPcs, revenue, avgOrder, count: filtered.length, trendData, stChart, payChart, timeChart, topSelling, 
      successRate, topPayMethod, topPayPct, peakSlot: timeChart[0]?.name 
    };
  }, [orders, timeRange, startDate, endDate]);

  if (loading && orders.length === 0) return null; // Let loading.js handle the initial shell

  const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];
  const timeOptions = [
    { id: 'Today', label: 'Today' },
    { id: 'Week', label: 'Week' },
    { id: 'Month', label: 'Month' },
    { id: 'All', label: 'All' }
  ];

  return (
    <div className="max-w-[2000px] mx-auto px-4 pt-0 pb-4 md:px-14 md:pt-0 md:pb-14 md:-mt-8 space-y-6 md:space-y-10">
      
      {/* Dynamic Header with Time Selection */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-black/5 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100" />
        <div className="space-y-2 md:space-y-3 z-10 w-full">
            <h1 className="text-3xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Business <span className="text-zinc-300">Reports</span></h1>
            <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1 rounded-full w-fit border border-black/5">
               <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Period: {timeRange.replace('_', ' ')} Analysis</span>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto z-10 overflow-x-auto no-scrollbar">
            <div className="flex items-center bg-zinc-50 p-1.5 rounded-2xl md:rounded-[2rem] border border-black/5 w-full sm:w-auto shrink-0 overflow-x-auto no-scrollbar">
               {timeOptions.map(t => (
                  <button 
                  key={t.id}
                  onClick={() => { setTimeRange(t.id); setStartDate(''); setEndDate(''); setIsCustomOpen(false); }}
                  className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all ${timeRange === t.id ? 'bg-zinc-950 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-950'}`}
                  >
                  {t.label}
                  </button>
               ))}
               <button 
                  onClick={() => setIsCustomOpen(!isCustomOpen)}
                  className={`ml-1 px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${timeRange === 'Custom' ? 'bg-zinc-950 text-white' : 'text-zinc-400 hover:bg-black/5'}`}
               >
                  <Calendar className="w-4 h-4" />
                  Custom
               </button>
            </div>

            <AnimatePresence>
               {isCustomOpen && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 bg-zinc-50 backdrop-blur-xl p-2 py-3 rounded-[2rem] border border-black/5 shadow-inner">
                     <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setTimeRange('Custom'); }} className="bg-transparent text-[11px] font-black outline-none uppercase text-zinc-950 pl-2 [color-scheme:light]"/>
                     <span className="text-zinc-300 font-bold">→</span>
                     <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setTimeRange('Custom'); }} className="bg-transparent text-[11px] font-black outline-none uppercase text-zinc-950 pr-2 [color-scheme:light]"/>
                  </motion.div>
               )}
            </AnimatePresence>
        </div>
      </div>

      {/* Primary KPI Grid (Refined) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Order Value', value: `৳ ${(reportData?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-zinc-950', bg: 'bg-zinc-50', sub: 'Gross income' },
          { label: 'Total Orders', value: reportData?.count || 0, icon: ShoppingBag, color: 'text-zinc-950', bg: 'bg-zinc-50', sub: 'Engagement count' },
          { label: 'Total Pcs Sold', value: `${reportData?.totalPcs || 0} Pcs`, icon: Layers, color: 'text-zinc-950', bg: 'bg-zinc-50', sub: 'Units distributed' },
          { label: 'Avg Order Value', value: `৳ ${Math.floor(reportData?.avgOrder || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-zinc-950', bg: 'bg-zinc-50', sub: 'Mean conversion' },
        ].map((kpi, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} className="bg-white p-7 rounded-[3.5rem] border border-black/5 shadow-xl flex flex-col gap-6 hover:shadow-2xl transition-all">
             <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center shadow-sm border border-black/5`}>
                <kpi.icon className="w-5 h-5" />
             </div>
             <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-zinc-950 uppercase tracking-tight">{kpi.value}</h3>
                <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">{kpi.sub}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Earnings Timeline */}
        <div className="xl:col-span-3 bg-white p-6 md:p-12 rounded-[3rem] md:rounded-[4.5rem] border border-black/5 shadow-xl space-y-6 md:space-y-10 relative">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-zinc-950 flex items-center gap-3 uppercase tracking-tighter">
                    Earnings <span className="text-zinc-300">Timeline</span>
                 </h3>
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Growth performance and progress flow</p>
              </div>
           </div>

           <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-black/5 flex items-center gap-4">
              <div className="bg-zinc-950 p-3 rounded-2xl text-white shadow-xl">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-[9px] font-black text-zinc-400 leading-relaxed uppercase tracking-widest">
                Insight: Average Bill is <span className="text-zinc-950 font-black">৳ {Math.floor(reportData?.avgOrder || 0).toLocaleString()}</span> with <span className="text-zinc-950 font-black">{reportData?.count} active orders</span>.
              </p>
           </div>
           
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData?.trendData || []}>
                  <defs>
                    <linearGradient id="coolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: 'rgba(0,0,0,0.3)'}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: 'rgba(0,0,0,0.3)'}} />
                  <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.1)'}} itemStyle={{color: '#18181b', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                  <Area type="monotone" dataKey="amount" stroke="#18181b" strokeWidth={4} fillOpacity={1} fill="url(#coolGrad)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Status Breakdown Sidebar */}
        <div className="bg-zinc-950 p-10 rounded-[3.5rem] shadow-2xl space-y-8 text-white relative h-full flex flex-col border border-black/5">
           <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">Success Rate</h3>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest pl-1">Order Mix Analysis</p>
           </div>
           <div className="flex-1 flex flex-col justify-center items-center py-6">
              <p className="text-6xl font-black text-white tracking-tighter">{reportData?.successRate}%</p>
              <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mt-2">Completion Score</p>
           </div>
           <div className="space-y-3 pb-2 border-t border-white/5 pt-6">
              {(reportData?.stChart || []).slice(0, 4).map((d, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-white/40">{d.name}</span>
                   <span className="text-white">{d.value}</span>
                </div>
              ))}
           </div>
           <p className="text-[9px] font-black text-white/40 bg-white/5 p-5 rounded-3xl text-center leading-relaxed uppercase tracking-widest">
             Insight: {(reportData?.stChart || []).find(d => d.name === 'Pending')?.value || 0} orders are currently pending review.
           </p>
        </div>
      </div>

      {/* Deep Insights Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
         <div className="bg-white p-12 rounded-[4rem] border border-black/5 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-4 uppercase tracking-tighter">
               Payments
            </h3>
            <div className="bg-zinc-50 p-5 rounded-[2rem] text-[9px] font-black text-zinc-400 leading-relaxed uppercase tracking-widest border border-black/5">
              Insight: <span className="text-zinc-950 underline">{reportData?.topPayMethod}</span> is preferred by {reportData?.topPayPct}% of users.
            </div>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData?.payChart || []}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: 'rgba(0,0,0,0.3)'}} />
                    <Bar dataKey="value" radius={[15, 15, 0, 0]}>
                      {(reportData?.payChart || []).map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-12 rounded-[4rem] border border-black/5 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-4 uppercase tracking-tighter">
               Timing
            </h3>
            <div className="bg-zinc-950 p-5 rounded-[2rem] flex items-center gap-3 shadow-xl">
               <Zap className="w-4 h-4 text-white animate-pulse" />
               <p className="text-[9px] font-black uppercase text-white tracking-widest">Peak Slot: <span className="font-black underline">{reportData?.peakSlot}</span></p>
            </div>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[... (reportData?.timeChart || [])].reverse()}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: 'rgba(0,0,0,0.3)'}} />
                    <Area type="monotone" dataKey="value" stroke="#18181b" fill="rgba(24,24,27,0.05)" fillOpacity={1} strokeWidth={4} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

          <div className="bg-white p-12 rounded-[4rem] border border-black/5 shadow-xl space-y-8">
             <h3 className="text-2xl font-black text-zinc-950 flex items-center justify-between uppercase tracking-tighter">Best Sellers</h3>
             <div className="space-y-6">
                {(reportData?.topSelling || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-zinc-400 border border-black/5 flex items-center justify-center font-black text-xl group-hover:bg-zinc-950 group-hover:text-white transition-all shadow-sm">
                       {i+1}
                    </div>
                    <div className="flex-1 space-y-3">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em]">
                          <span className="text-zinc-950">{p.name}</span>
                          <span className="text-zinc-400 underline">{p.count} Sold</span>
                       </div>
                       <div className="w-full h-1.5 bg-zinc-50 rounded-full overflow-hidden border border-black/5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(p.count / (reportData.topSelling[0]?.count || 1)) * 100}%` }} className="h-full bg-zinc-950" />
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
      </div>

    </div>
  );
}
