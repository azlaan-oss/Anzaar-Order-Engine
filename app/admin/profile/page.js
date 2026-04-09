"use client";

import React, { useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ShieldCheck, Fingerprint, Zap, Key, Server, Save, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [name, setName] = useState(userData?.name || '');
  const [saving, setSaving] = useState(false);

  if (!userData) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty.");
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name });
      toast.success("Identity Protocols Updated Successfully.");
    } catch (err) {
      toast.error("Failed to update identity. Secure connection required.");
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = () => {
    if (userData.role === 'super_admin') return 'text-gold-400 bg-gold-400/10 border-gold-400/30';
    if (userData.role === 'manager') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-emerald-950 text-gold-400 rounded-2xl shadow-lg border border-gold-400/20">
           <Fingerprint className="w-6 h-6" />
        </div>
        <div>
           <h1 className="text-3xl font-serif font-black text-emerald-950 dark:text-white uppercase tracking-tight">Agent Identification</h1>
           <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Anzaar Security Clearances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: The ID Card */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-emerald-950 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-emerald-900 shadow-emerald-900/20">
              
              {/* Holographic BG */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#022c22_0%,#064e3b_50%,#022c22_100%)] animate-[spin_10s_linear_infinite] opacity-50 mix-blend-screen" />
              
              <div className="relative z-10 flex flex-col items-center">
                 <div className="w-full flex justify-between items-start mb-10">
                    <div className="space-y-1">
                       <h2 className="font-serif font-black italic tracking-tighter text-2xl text-gold-400">ANZAAR</h2>
                       <p className="text-[7px] uppercase font-bold tracking-[0.3em] text-white/40">Secure Identity Core</p>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-emerald-500 opacity-50" />
                 </div>
                 
                 <div className="relative group cursor-pointer mb-8">
                    <div className="w-32 h-32 rounded-full border-4 border-emerald-800 bg-black/50 backdrop-blur-xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                       <span className="text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-br from-gold-300 to-gold-600">
                          {userData.name?.[0]?.toUpperCase() || 'A'}
                       </span>
                    </div>
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] rounded-full hidden group-hover:block animate-[shimmer_2s_infinite]" />
                 </div>

                 <div className="text-center w-full space-y-6">
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">{userData.name || 'Unknown Agent'}</h3>
                       <p className="text-[10px] font-mono text-emerald-400/70 mt-1">{userData.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                       <div className="text-left">
                          <p className="text-[7px] uppercase tracking-widest text-white/30 mb-1">Clearance Level</p>
                          <div className={`px-2 py-1 rounded inline-flex items-center gap-1 border ${getRoleColor()}`}>
                             <Zap className="w-3 h-3" />
                             <span className="text-[8px] font-black uppercase tracking-widest">{userData.role?.replace('_', ' ')}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[7px] uppercase tracking-widest text-white/30 mb-1">Operational ID</p>
                          <p className="text-[9px] font-mono text-white/60 truncate">{user.uid}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Security Status Mini-Cards */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-emerald-950 border border-gray-100 dark:border-white/5 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <Server className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Node Status</p>
                    <p className="text-xs font-bold text-emerald-950 dark:text-white">Encrypted</p>
                 </div>
              </div>
              <div className="bg-white dark:bg-emerald-950 border border-gray-100 dark:border-white/5 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <Key className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Auth Token</p>
                    <p className="text-xs font-bold text-emerald-950 dark:text-white">Active</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Settings & Config */}
        <div className="lg:col-span-7 space-y-6">
           <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-emerald-950 rounded-[3rem] p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-xl">
              <h3 className="text-xl font-serif font-black text-emerald-950 dark:text-white uppercase tracking-tight mb-8">Identity Configuration</h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Display Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-2 bg-gray-50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 text-gray-900 dark:text-white px-6 py-4 rounded-3xl outline-none focus:border-gold-400/50 transition-all font-bold"
                      placeholder="Enter your operational name"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-4">Primary Contact Method</label>
                    <div className="relative mt-2">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/30 dark:text-white/30" />
                       <input 
                         type="email" 
                         value={user.email}
                         disabled
                         className="w-full bg-gray-100 dark:bg-black/40 border-2 border-transparent text-gray-400 px-6 pl-14 py-4 rounded-3xl outline-none font-bold cursor-not-allowed"
                       />
                    </div>
                    <p className="text-[9px] font-medium text-gray-400 mt-2 pl-4 italic">Operational emails cannot be altered after creation due to security constraints.</p>
                 </div>

                 <div className="pt-6">
                    <button 
                       type="submit"
                       disabled={saving || name === userData.name}
                       className="w-full md:w-auto bg-emerald-950 dark:bg-gold-400 text-white dark:text-emerald-950 px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                       {saving ? <div className="w-4 h-4 border-2 border-emerald-950/20 border-t-emerald-950 rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                       Synchronize Identity
                    </button>
                 </div>
              </div>
           </form>

           <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[3rem] p-8 md:p-12">
              <h3 className="text-xl font-serif font-black text-red-600 dark:text-red-400 uppercase tracking-tight mb-2">Danger Zone</h3>
              <p className="text-xs text-red-500/70 font-medium mb-6">Irreversible actions that could sever your connection to the Anzaar network.</p>
              
              <button 
                 type="button" 
                 onClick={() => toast.error("Self-termination is restricted. Contact another Super Admin.")}
                 className="px-6 py-3 rounded-2xl border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              >
                 Revoke My Own Access
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
