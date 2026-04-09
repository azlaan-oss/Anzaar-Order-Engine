"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, Zap, RefreshCw, Circle, CheckCircle2, Globe, Database } from 'lucide-react';
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
      toast.success('Access Granted. Routing to Control Center...');
    } catch (err) {
      toast.error('Authentication Failed. Please verify your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Quantum Access Security",
      desc: "Granular, role-based authorization matrix ensuring total operational safety for all intelligence tiers."
    },
    {
      icon: Database,
      title: "Cloud Sync Engine",
      desc: "Instantly synchronizes high-density product data and order streams across a global architecture."
    },
    {
      icon: Globe,
      title: "Global Logistics Control",
      desc: "Advanced routing algorithms natively handle dynamic enterprise-level shipping variables."
    }
  ];

  return (
    <div className="min-h-screen bg-emerald-950 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] flex flex-col xl:flex-row relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1)_0%,transparent_50%)] animate-pulse-slow mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[20%] w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_60%)] animate-pulse-slow mix-blend-screen delay-1000" />
      </div>

      {/* Left: Enterprise Marketing Presentation */}
      <div className="flex-1 px-6 py-12 lg:px-20 lg:py-20 flex flex-col justify-between relative z-10 hidden md:flex min-h-screen">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gold-400 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-400/20">
             <span className="font-serif font-black text-emerald-950 text-2xl">a</span>
          </div>
          <div>
            <h2 className="text-white font-serif font-black tracking-tight text-xl">ANZAAR</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gold-400/80 leading-none mt-1">Intelligence</p>
          </div>
        </motion.div>

        <div className="max-w-2xl my-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
               <Zap className="w-3 h-3 text-gold-400 fill-gold-400" />
               <span className="text-[10px] text-white/80 font-black uppercase tracking-widest">Enterprise Edition v4.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tighter leading-[1.1] mb-8">
              Strategic Control<br/>
              <span className="text-emerald-500 italic">Redefined.</span>
            </h1>
            <p className="text-lg lg:text-xl text-white/50 font-medium max-w-xl leading-relaxed mb-16 border-l-2 border-gold-400/30 pl-6">
              Welcome to the central nervous system of Anzaar. A world-class order engine built exclusively to command high-end inventory and global logistics.
            </p>
          </motion.div>

          <div className="space-y-6">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + (idx * 0.1) }}
                className="flex items-start gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all backdrop-blur-xl group"
              >
                <div className="bg-emerald-950/50 p-4 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                   <feature.icon className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                   <h3 className="text-white font-black uppercase tracking-widest text-xs mb-2">{feature.title}</h3>
                   <p className="text-white/40 text-[11px] leading-relaxed font-bold">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="flex items-center gap-6 mt-20"
        >
           <div className="flex -space-x-4">
              {[1,2,3].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-emerald-950 bg-emerald-${i*200} flex items-center justify-center`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                </div>
              ))}
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Trusted by the Anzaar Global Network</p>
        </motion.div>

      </div>

      {/* Right: Security & Login Portal */}
      <div className="w-full xl:w-[600px] 2xl:w-[700px] min-h-screen bg-emerald-950/80 backdrop-blur-3xl border-l border-white/5 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative z-20 shadow-2xl">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex md:hidden flex-col items-center mb-12 w-full text-center">
            <div className="w-16 h-16 bg-gold-400 rounded-[2rem] flex items-center justify-center shadow-lg shadow-gold-400/20 mb-6">
               <span className="font-serif font-black text-emerald-950 text-4xl leading-none pt-1">a</span>
            </div>
            <h2 className="text-3xl font-serif font-black text-white tracking-tighter">ANZAAR</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gold-400/80 leading-none mt-2">Intelligence</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md mb-6">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
               <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Restricted Area</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-serif font-black text-white tracking-tight mb-3">Agent Login</h2>
            <p className="text-white/40 text-xs font-medium leading-relaxed">
              Enter your credentials to access the operational mainframe. All login attempts are recorded and monitored.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/50 pl-2">Operational Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-gold-400 transition-colors" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border-2 border-white/5 text-white p-5 pl-14 rounded-3xl outline-none focus:border-gold-400/30 transition-all font-bold text-sm shadow-inner"
                  placeholder="agent@anzaar.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pl-2 pr-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/50">Passcode</label>
                 <span className="text-[9px] font-black text-gold-400/50 hover:text-gold-400 cursor-pointer uppercase tracking-widest transition-colors">Forgot?</span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 group-focus-within:text-gold-400 transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border-2 border-white/5 text-white p-5 pl-14 rounded-3xl outline-none focus:border-gold-400/30 transition-all font-bold text-sm shadow-inner tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold-400 to-gold-500 text-emerald-950 p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_40px_-10px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_-10px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group mt-10"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                <>
                  Establish Connection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 pt-8 border-t-2 border-white/5">
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
                   <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-0.5">End-to-End Encrypted</p>
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">AES-256 Military Grade Standard</p>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Small floating status indicators bottom right */}
        <div className="absolute bottom-8 right-8 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
           <div className="w-2 h-2 rounded-full bg-emerald-500 relative" />
           <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">System Online</span>
        </div>

      </div>
    </div>
  );
}
