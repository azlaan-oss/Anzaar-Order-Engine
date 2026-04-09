"use client";

import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfigCheck() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check for Firebase API Key in the browser
    const hasConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!hasConfig) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100000] p-4 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-emerald-950 border border-gold-400/20 shadow-2xl rounded-[2rem] overflow-hidden flex items-center gap-4 p-4 md:p-6 backdrop-blur-xl relative group">
            
            {/* Animated Glow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gold-400/5 via-transparent to-gold-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="bg-gold-400/10 p-3 rounded-2xl">
              <Settings className="w-6 h-6 text-gold-400 animate-spin-slow" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-gold-400 uppercase tracking-[0.2em] leading-none">Console Setup Required</span>
                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[8px] font-bold rounded uppercase">Missing Credentials</span>
              </div>
              <h4 className="text-white font-serif font-bold text-sm md:text-base tracking-tight leading-none">
                Vault Intelligence is currently inactive
              </h4>
              <p className="text-gray-400 text-[10px] md:text-xs mt-1.5 leading-relaxed font-medium">
                Please configure your <span className="text-white">Environment Variables</span> in the Vercel Dashboard to connect this engine to your Firebase instance.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
               <a 
                href="https://vercel.com/azlaans-projects-3f79c7e2/anzaar-order-engine-4eop/settings/environment-variables" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gold-400 text-emerald-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gold-500 hover:scale-105 transition-all shadow-lg"
               >
                 Go to Dashboard
                 <ExternalLink className="w-3 h-3" />
               </a>
               <button 
                onClick={() => setIsDismissed(true)}
                className="p-3 text-gray-500 hover:text-white transition-colors"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
