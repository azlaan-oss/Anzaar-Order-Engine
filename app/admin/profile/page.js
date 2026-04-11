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
    if (userData.role === 'super_admin') return 'text-zinc-950 bg-zinc-100 border-zinc-200';
    if (userData.role === 'manager') return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    return 'text-zinc-500 bg-zinc-50 border-zinc-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-10 px-4 pt-4">
        <div className="p-3 bg-white text-zinc-950 rounded-2xl shadow-xl border border-black/5">
           <Fingerprint className="w-6 h-6" />
        </div>
        <div>
           <h1 className="text-3xl md:text-4xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Agent <span className="text-zinc-300">Identity</span></h1>
           <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Secure Protocol Clearances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Left: The ID Card */}
          <div className="lg:col-span-5 space-y-6 px-4">
             <div className="bg-white rounded-[3.5rem] p-8 md:p-12 text-zinc-950 shadow-2xl relative overflow-hidden group border border-black/5">
                
                {/* Holographic BG */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#f8fafc_0%,#f1f5f9_50%,#f8fafc_100%)] animate-[spin_10s_linear_infinite] opacity-50 mix-blend-multiply" />
                              <div className="relative z-10 flex flex-col items-center">
                   <div className="w-full flex justify-between items-start mb-10">
                      <div className="space-y-1">
                         <h2 className="font-black tracking-tighter text-2xl text-zinc-950 uppercase">ANZAAR</h2>
                         <p className="text-[7px] uppercase font-black tracking-[0.3em] text-zinc-300">Identity Protocol Core</p>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-zinc-200" />
                   </div>
                   <div className="relative group cursor-pointer mb-8">
                      <div className="w-32 h-32 rounded-full border-4 border-black/5 bg-zinc-50 flex items-center justify-center shadow-lg">
                         <span className="text-5xl font-black text-zinc-950">
                            {userData.name?.[0]?.toUpperCase() || 'A'}
                         </span>
                      </div>
                      {/* Scanning Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-950 shadow-[0_0_20px_black] rounded-full hidden group-hover:block animate-[shimmer_2s_infinite]" />
                   </div>

                   <div className="text-center w-full space-y-6">
                      <div>
                         <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-950">{userData.name || 'Unknown Agent'}</h3>
                         <p className="text-[9px] font-black text-zinc-300 mt-2 uppercase tracking-widest">{userData.email}</p>
                      </div>
 
                      <div className="grid grid-cols-2 gap-4 border-t border-black/5 pt-6">
                         <div className="text-left">
                            <p className="text-[7px] uppercase tracking-[0.3em] text-zinc-300 mb-1">Clearance Level</p>
                            <div className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 border shadow-sm ${getRoleColor()}`}>
                               <Zap className="w-2.5 h-2.5" />
                               <span className="text-[8px] font-black uppercase tracking-widest">{userData.role?.replace('_', ' ')}</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[7px] uppercase tracking-[0.3em] text-zinc-300 mb-1">Operational ID</p>
                            <p className="text-[9px] font-mono text-zinc-400 truncate">{user.uid}</p>
                         </div>
                      </div>
                   </div>
              </div>
           </div>

             {/* Security Status Mini-Cards */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-black/5 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                   <div className="p-2 bg-zinc-50 text-zinc-400 rounded-xl">
                      <Server className="w-4 h-4" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Node Status</p>
                      <p className="text-xs font-black text-zinc-950 uppercase tracking-tight">Encrypted</p>
                   </div>
                </div>
                <div className="bg-white border border-black/5 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
                   <div className="p-2 bg-zinc-50 text-zinc-400 rounded-xl">
                      <Key className="w-4 h-4" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Auth Token</p>
                      <p className="text-xs font-black text-zinc-950 uppercase tracking-tight">Active</p>
                   </div>
                </div>
             </div>
        </div>

          {/* Right: Settings & Config */}
          <div className="lg:col-span-7 space-y-6 px-4">
             <form onSubmit={handleUpdateProfile} className="bg-white rounded-[3.5rem] p-8 md:p-12 border border-black/5 shadow-2xl">
                <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tighter mb-8">Identity Config</h3>
               
               <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 pl-4">Personal Designation</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full mt-2 bg-zinc-50 border border-black/5 text-zinc-950 px-6 py-4 rounded-3xl outline-none focus:border-black/20 transition-all font-black uppercase tracking-tight"
                        placeholder="Enter designation..."
                      />
                   </div>

                   <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-300 pl-4">Registry Contact</label>
                      <div className="relative mt-2">
                         <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
                         <input 
                           type="email" 
                           value={user.email}
                           disabled
                           className="w-full bg-zinc-50 border border-transparent text-zinc-300 px-6 pl-14 py-4 rounded-3xl outline-none font-black cursor-not-allowed uppercase tracking-tight"
                         />
                      </div>
                      <p className="text-[8px] font-black text-zinc-200 mt-3 pl-4 uppercase tracking-widest italic">Immutable: Operational registry addresses are locked for security.</p>
                   </div>

                   <div className="pt-6">
                      <button 
                         type="submit"
                         disabled={saving || name === userData.name}
                         className="w-full md:w-auto bg-zinc-950 text-white px-10 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                      >
                         {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                         Commit Identity
                      </button>
                   </div>
              </div>
           </form>

             <div className="bg-white border border-black/5 rounded-[3.5rem] p-8 md:p-12 shadow-xl">
                <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tighter mb-2">Restricted Actions</h3>
                <p className="text-[9px] text-zinc-300 font-black uppercase tracking-[0.2em] mb-8">Irreversible actions that could sever your network connectivity.</p>
                
                <button 
                   type="button" 
                   onClick={() => toast.error("Self-termination is restricted. Contact a Super Admin.")}
                   className="px-8 py-4 rounded-2xl border border-black/5 text-zinc-400 font-black text-[9px] uppercase tracking-[0.2em] hover:bg-zinc-50 hover:text-zinc-950 transition-all shadow-sm"
                >
                   Revoke Network Uplink
                </button>
             </div>
        </div>
      </div>
    </div>
  );
}
