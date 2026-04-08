"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  ArrowLeft, 
  Calendar, 
  Download, 
  TrendingUp,
  Package,
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { generateReportData, formatReportToText } from '../../../lib/report-utils';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrdersForReport = async () => {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        // Logic: For a daily report, we fetch all orders and filter by the selected day
        const q = query(ordersRef, orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setOrders(list);
      } catch (err) {
        console.error(err);
        toast.error("Telemetry failure: Could not reach order vaults.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersForReport();
  }, []);

  const dailyOrders = useMemo(() => {
    const target = new Date(reportDate).toDateString();
    return orders.filter(o => new Date(o.timestamp).toDateString() === target);
  }, [orders, reportDate]);

  const reportStats = useMemo(() => generateReportData(dailyOrders), [dailyOrders]);

  const copyToClipboard = () => {
    const dateFormatted = new Date(reportDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
    const text = formatReportToText(reportStats, dateFormatted);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Consolidated report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6">
      
      {/* Premium Hub Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Link href="/" className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-emerald-50 text-emerald-950 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div className="px-3 py-1 bg-emerald-950 text-gold-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold-400/20 shadow-lg">
                Intelligence v4.1
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-emerald-950 tracking-tighter">Daily Report Vault</h1>
          <p className="text-gray-400 font-medium text-sm md:text-base max-w-xl">
             Automated data synthesis of sales velocity and operational health.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-900 ml-2" />
              <input 
                type="date" 
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none pr-4"
              />
           </div>
           <button 
             onClick={copyToClipboard}
             className="bg-emerald-900 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-950 active:scale-95 transition-all flex items-center gap-3"
           >
             {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
             {copied ? 'Copied' : 'Pro Sync'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Statistics Grid */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                 <div className="bg-emerald-50 p-2 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-emerald-900" />
                 </div>
                 <h3 className="font-serif font-bold text-xl text-emerald-950">Volume Stats</h3>
              </div>

              <div className="space-y-6">
                 {[
                   { label: 'Regular Orders', value: reportStats.regularOrders, sub: reportStats.regularProducts + ' Pcs' },
                   { label: 'Customize Orders', value: reportStats.customizeOrders, sub: reportStats.customizeProducts + ' Pcs' },
                   { label: 'Grand Summary', value: reportStats.totalOrders, sub: reportStats.totalProducts + ' Pcs', highlight: true }
                 ].map((row, i) => (
                   <div key={i} className={`flex items-center justify-between p-4 rounded-2xl ${row.highlight ? 'bg-emerald-950 text-white' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${row.highlight ? 'text-emerald-400' : 'text-gray-400'}`}>{row.label}</p>
                        <p className="text-xs font-medium opacity-60 italic">{row.sub}</p>
                      </div>
                      <span className="text-2xl font-black">{row.value}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100/50 space-y-6">
              <div className="flex items-center gap-3">
                 <Globe className="w-5 h-5 text-amber-600" />
                 <h3 className="font-serif font-bold text-xl text-amber-950">Fiscal Velocity</h3>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="text-[9px] font-bold text-amber-600/50 uppercase tracking-widest pl-1">Total Advance</label>
                    <div className="text-2xl font-black text-emerald-950 mt-1">৳ {reportStats.totalAdvance.toLocaleString()}</div>
                 </div>
                 <div className="pt-4 border-t border-amber-200/50">
                    <label className="text-[9px] font-bold text-amber-600/50 uppercase tracking-widest pl-1">Total Order Value</label>
                    <div className="text-3xl font-black text-emerald-950 mt-1">৳ {reportStats.totalValue.toLocaleString()}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Product List Deck */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <Package className="w-6 h-6 text-emerald-950" />
                 <h2 className="text-2xl font-serif font-black text-emerald-950">Product Velocity List</h2>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{Object.keys(reportStats.productCounts).length} SKUs Listed</p>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[500px]">
              {loading ? (
                <div className="p-10 space-y-4 animate-pulse">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-gray-50 rounded-2xl" />)}
                </div>
              ) : Object.keys(reportStats.productCounts).length === 0 ? (
                <div className="text-center py-40 text-gray-200">
                   <Zap className="w-16 h-16 mx-auto opacity-10 mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest italic">No operational data recorded for this cycle.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-50">
                   {Object.entries(reportStats.productCounts)
                    .sort((a,b) => b[1] - a[1])
                    .map(([name, count], index) => (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        key={name} 
                        className="bg-white p-6 flex items-center justify-between group hover:bg-emerald-50/50 transition-all"
                      >
                         <div className="flex items-center gap-5">
                            <span className="text-[10px] font-black text-gray-200 group-hover:text-emerald-900 transition-colors uppercase tracking-widest">{String(index + 1).padStart(2, '0')}</span>
                            <h4 className="font-bold text-emerald-950 text-sm md:text-base uppercase tracking-tight">{name}</h4>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-300 uppercase italic">Pcs</span>
                            <span className="text-xl font-black text-emerald-900">{count}</span>
                         </div>
                      </motion.div>
                    ))}
                </div>
              )}
           </div>

           <div className="p-8 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">End of Daily Report Synthesis</p>
           </div>
        </div>

      </div>
    </div>
  );
}
