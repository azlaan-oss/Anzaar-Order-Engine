"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FileSpreadsheet, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
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
      <div className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between border border-black/5 shadow-xl">
         <div className="flex items-center gap-5">
            <div className="bg-zinc-950 text-white p-4 rounded-2xl border border-black/5 shadow-lg">
               <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-black text-zinc-950 uppercase tracking-tighter leading-none">Live <span className="text-zinc-400">Matrix</span></h2>
               <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center gap-1.5 text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-zinc-50 px-3 py-1.5 rounded-lg border border-black/5">
                     <ShieldCheck className="w-2.5 h-2.5" /> Encrypted Relay
                  </span>
                  <span className="flex items-center gap-1.5 text-[8px] font-black text-zinc-950 uppercase tracking-[0.2em] bg-zinc-100 px-3 py-1.5 rounded-lg border border-black/5">
                     <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> Real-time Sync
                  </span>
               </div>
            </div>
         </div>

         {sheetId && (
            <div className="flex items-center gap-4">
               <div className="hidden md:block text-right pr-6 border-r border-black/5">
                  <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-1">Authenticated ID</p>
                  <p className="text-[9px] font-mono font-black text-zinc-400 tracking-widest">{sheetId.substring(0, 12)}...</p>
               </div>
               <a 
                href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`} 
                target="_blank" 
                className="bg-zinc-950 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
               >
                 <ExternalLink className="w-4 h-4" />
                 Launch Master
               </a>
            </div>
         )}
      </div>

        {/* Main Iframe Architecture */}
        <div className="flex-1 bg-white rounded-[3.5rem] border border-black/5 overflow-hidden relative group shadow-xl">
          {!iframeLoaded && !loading && sheetId && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-3xl z-10 transition-opacity duration-1000">
               <div className="flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-black/5 border-t-zinc-950 rounded-full animate-spin" />
                  <p className="text-[9px] font-black text-zinc-950 uppercase tracking-[0.4em] animate-pulse">Establishing Handshake...</p>
               </div>
            </div>
          )}

          {loading ? (
           <div className="w-full h-full flex items-center justify-center bg-zinc-50">
              <div className="w-16 h-16 border-4 border-black/5 border-t-zinc-950 rounded-full animate-spin" />
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
           <div className="w-full h-full flex flex-col items-center justify-center p-20 space-y-10">
             <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center border border-black/5">
                <AlertTriangle className="w-8 h-8 text-zinc-200" />
             </div>
             <div className="text-center max-w-sm space-y-4">
                <p className="text-2xl font-black text-zinc-950 uppercase tracking-tighter">Cipher Link Missing</p>
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-relaxed">
                   Your primary Google Sheet ID is currently unconfigured. Please navigate to system protocol to establish connection.
                </p>
             </div>
           </div>
         )}

          {/* Floating Health Status Badge */}
          {iframeLoaded && (
             <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-10 left-10 bg-white text-zinc-950 px-5 py-2.5 rounded-2xl flex items-center gap-4 border border-black/5 shadow-2xl"
             >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] pr-4 border-r border-black/5">Protocol: Healthy</span>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em]">Pipeline Active</span>
             </motion.div>
          )}
      </div>
    </div>
  );
}
