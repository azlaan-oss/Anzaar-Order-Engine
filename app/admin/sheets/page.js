"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SheetsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const sheetId = settings?.activeSheetId;

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col gap-6 -mt-4">
      
      {/* Premium Header Container */}
      <div className="bg-white/80 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white shadow-xl shadow-emerald-950/5 flex items-center justify-between">
         <div className="flex items-center gap-5">
            <div className="bg-emerald-100 text-emerald-900 p-4 rounded-2xl">
               <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
               <h2 className="text-2xl font-serif font-black text-emerald-950">Live Matrix Summary</h2>
               <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                     <ShieldCheck className="w-3 h-3" /> Encrypted Relay
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                     <RefreshCw className="w-3 h-3 animate-spin-slow" /> Real-time Sync
                  </span>
               </div>
            </div>
         </div>

         {sheetId && (
            <div className="flex items-center gap-4">
               <div className="hidden md:block text-right pr-4 border-r border-emerald-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated ID</p>
                  <p className="text-[10px] font-mono font-bold text-emerald-950">{sheetId.substring(0, 12)}...</p>
               </div>
               <a 
                href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`} 
                target="_blank" 
                className="bg-emerald-950 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all"
               >
                 <ExternalLink className="w-4 h-4 text-emerald-500" />
                 Launch Master File
               </a>
            </div>
         )}
      </div>

      {/* Main Iframe Architecture */}
      <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative group">
        {!iframeLoaded && !loading && sheetId && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-10 transition-opacity duration-1000">
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.3em] animate-pulse">Establishing Handshake...</p>
             </div>
          </div>
        )}

        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50">
             <div className="w-16 h-16 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin" />
          </div>
        ) : sheetId ? (
          <iframe 
            src={`https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=0`}
            className="w-full h-full border-none"
            title="Google Sheets Full View"
            onLoad={() => setIframeLoaded(true)}
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-20 space-y-6">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-40" />
            </div>
            <div className="text-center max-w-sm">
               <p className="text-xl font-serif font-black text-emerald-950 uppercase tracking-tighter">Cipher Link Missing</p>
               <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed">
                  Your primary Google Sheet ID is currently unconfigured. Please navigate to 
                  <span className="font-black text-emerald-950 mx-1">Settings &gt; Protocol</span> 
                  to establish the master connection.
               </p>
            </div>
          </div>
        )}

        {/* Floating Health Status Badge */}
        {iframeLoaded && (
           <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-8 left-8 bg-emerald-950/90 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-3 border border-emerald-800 shadow-2xl"
           >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[9px] font-black uppercase tracking-widest pr-2 border-r border-white/10">Engine Status: Healthy</span>
              <span className="text-[9px] font-bold text-emerald-400">Sync Pipeline Active</span>
           </motion.div>
        )}
      </div>
    </div>
  );
}
