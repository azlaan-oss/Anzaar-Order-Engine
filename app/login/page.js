"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, Zap, RefreshCw, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Access Granted. Welcome back, Agent.');
    } catch (err) {
      toast.error('Access Denied. Invalid credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200000] bg-emerald-950 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_50%_50%,#d4af37_0%,transparent_50%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-[0_0_100px_-20px_rgba(212,175,55,0.15)] relative overflow-hidden group">
          
          {/* Animated Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-gold-400/10 rounded-[2rem] flex items-center justify-center mb-6 border border-gold-400/20 relative">
               <div className="absolute inset-0 bg-gold-400/10 animate-ping rounded-[2rem] opacity-20" />
               <ShieldCheck className="w-10 h-10 text-gold-400 relative z-10" />
            </div>
            <h1 className="text-3xl font-serif font-black text-white tracking-tight mb-2 uppercase italic">Anzaar Intelligence</h1>
            <p className="text-gold-400/40 text-[10px] font-black uppercase tracking-[0.3em]">Operational Security Protocol v4.0</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Digital Identity</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/40" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white p-5 pl-12 rounded-3xl outline-none focus:border-gold-400/30 transition-all font-medium text-sm"
                  placeholder="agent.id@anzaar.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Encryption Key</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/40" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white p-5 pl-12 rounded-3xl outline-none focus:border-gold-400/30 transition-all font-medium text-sm"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gold-400 text-emerald-950 p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-gold-500 active:scale-95 transition-all flex items-center justify-center gap-3 group relative overflow-hidden mt-8"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                <>
                  Verify Credentials
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-gold-500 fill-gold-500 animate-pulse" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Quantum Encryption Enabled</span>
             </div>
             <p className="text-[8px] text-white/10 font-medium uppercase tracking-widest text-center leading-relaxed">
               Access is restricted to authorized personnel only.<br/>All activity is logged and encrypted.
             </p>
          </div>
        </div>

        {/* Floating status dots */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20">
           <Circle className="w-1.5 h-1.5 fill-gold-400 text-gold-400" />
           <Circle className="w-1.5 h-1.5 text-white/20" />
           <Circle className="w-1.5 h-1.5 text-white/20" />
        </div>
      </motion.div>
    </div>
  );
}
