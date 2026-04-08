"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ShoppingBag, TrendingUp, CreditCard, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrdersPage() {
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ gross: 0, net: 0, due: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsSnap, ordersSnap] = await Promise.all([
          getDoc(doc(db, "settings", "global")),
          getDocs(collection(db, "orders"))
        ]);

        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }

        let gross = 0, due = 0;
        ordersSnap.forEach(doc => {
          const d = doc.data();
          gross += d.totals?.total || 0;
          due += d.totals?.due || 0;
        });
        setStats({ gross, due, net: gross - due });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sheetId = settings?.activeSheetId;

  const topStats = [
    { label: 'Gross Volume', value: stats.gross, icon: TrendingUp, color: 'text-emerald-900', bg: 'bg-emerald-50' },
    { label: 'Net Collected', value: stats.net, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Due', value: stats.due, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col gap-6 -mt-4">
      
      {/* Quick Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topStats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
             <div className={`${s.bg} ${s.color} p-3 rounded-xl`}>
               <s.icon className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
               <h3 className="text-xl font-black text-emerald-950">৳ {s.value.toLocaleString()}</h3>
             </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden relative group">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-900/20 border-t-emerald-900 rounded-full animate-spin" />
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Accessing Secure Vault...</p>
             </div>
          </div>
        ) : sheetId ? (
          <>
            <iframe 
              src={`https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=0`}
              className="w-full h-full border-none"
              title="Google Sheets All Orders"
              allowFullScreen
            />
            <a 
              href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`} 
              target="_blank" 
              className="absolute bottom-6 right-6 bg-emerald-950 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Sheets
            </a>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-20 space-y-4">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
            <p className="text-gray-500 font-bold">Please configure your Google Sheet ID in Settings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
