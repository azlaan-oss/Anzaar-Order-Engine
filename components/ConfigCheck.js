"use client";

import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfigCheck() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, testing, success, error
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    // Check for Firebase API Key in the browser
    const hasConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!hasConfig) {
      setIsVisible(true);
    }
  }, []);

  const testSync = async () => {
    setSyncStatus('testing');
    try {
      const res = await fetch('/api/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: 'PING-TEST',
          timestamp: new Date().toISOString(),
          customer: { name: 'Health Check', phone: '0000', address: 'System' },
          items: [{ name: 'Diagnostics', price: 0, quantity: 1 }],
          isTest: true 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus('success');
        setActiveTab(data.message.split('to ')[1] || 'Connected');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setSyncStatus('error');
      console.error("Diagnostic Sync Failed:", err);
    }
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {(isVisible || syncStatus !== 'idle') && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100000] p-4 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className={`bg-white border rounded-[2rem] overflow-hidden flex items-center gap-4 p-4 md:p-6 backdrop-blur-xl relative group transition-all duration-500 ${
              syncStatus === 'success' ? 'border-green-500/20 bg-green-50/10' : 
              syncStatus === 'error' ? 'border-red-500/20 bg-red-50/10' : 'border-black/5 shadow-2xl'
            }`}>
              
              <div className={`p-3 rounded-2xl border transition-colors ${
                syncStatus === 'success' ? 'bg-green-50 text-green-500 border-green-100' :
                syncStatus === 'error' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-zinc-50 text-zinc-400 border-black/5'
              }`}>
                {syncStatus === 'testing' ? <RefreshCw className="w-6 h-6 animate-spin" /> : 
                 syncStatus === 'success' ? <ShieldCheck className="w-6 h-6" /> :
                 syncStatus === 'error' ? <AlertCircle className="w-6 h-6" /> : <Settings className="w-6 h-6 animate-spin-slow" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] leading-none">
                    {syncStatus === 'success' ? 'Protocol Online' : syncStatus === 'error' ? 'Sync Failure' : 'Console Setup Status'}
                  </span>
                  {isVisible && !syncStatus === 'success' && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[8px] font-bold rounded uppercase border border-red-100">Missing Credentials</span>
                  )}
                </div>
                <h4 className="text-zinc-950 font-serif font-bold text-sm md:text-base tracking-tight leading-none">
                  {syncStatus === 'success' ? `Matrix Synchronized: ${activeTab}` : 
                   syncStatus === 'error' ? 'Master Matrix unreachable' : 
                   isVisible ? 'Vault Intelligence is currently inactive' : 'System Connectivity'}
                </h4>
                <p className="text-zinc-400 text-[10px] md:text-xs mt-1.5 leading-relaxed font-medium">
                  {syncStatus === 'success' ? 'The engine is successfully broadcasting data to the Google Sheets core.' :
                   syncStatus === 'error' ? 'The service account was unable to authenticate with the spreadsheet.' :
                   'Configure your environment variables to enable the Real-time Sync Engine.'}
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3">
                 {isVisible ? (
                   <a 
                    href="https://vercel.com/azlaans-projects-3f79c7e2/anzaar-order-engine-4eop/settings/environment-variables" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:scale-105 transition-all shadow-lg"
                   >
                     Go to Dashboard
                     <ExternalLink className="w-3 h-3" />
                   </a>
                 ) : (
                   <button 
                    onClick={testSync}
                    disabled={syncStatus === 'testing'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                      syncStatus === 'success' ? 'bg-green-500 text-white' : 
                      syncStatus === 'error' ? 'bg-red-500 text-white' : 'bg-zinc-950 text-white hover:bg-black'
                    }`}
                   >
                     {syncStatus === 'testing' ? 'Testing...' : 'Ping Sync'}
                     <RefreshCw className={`w-3 h-3 ${syncStatus === 'testing' ? 'animate-spin' : ''}`} />
                   </button>
                 )}
                 <button 
                  onClick={() => setIsDismissed(true)}
                  className="p-3 text-gray-500 hover:text-zinc-950 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
