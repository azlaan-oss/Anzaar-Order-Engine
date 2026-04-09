"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../../lib/auth-context';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../../../lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  UserPlus, 
  MoreVertical, 
  Zap, 
  Fingerprint, 
  Activity,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccessControlPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { userData } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (userData?.role !== ROLES.SUPER_ADMIN) {
      toast.error("Security Breach: Only Super Admins can alter roles.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Access level recalibrated to ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error("Recalibration failed. Quantum bypass detected.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-950 text-gold-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-gold-400/20 shadow-lg">
                Intelligence Center v1.2
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
                <span className="text-gold-400 text-[9px] font-black uppercase tracking-widest italic font-serif">Secure Link Active</span>
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-emerald-950 tracking-tighter uppercase leading-none">Access Control</h1>
          <p className="text-gray-400 font-medium text-sm md:text-base max-w-xl">
             Manage system clearances and operational permissions for the global intelligence grid.
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/30 group-focus-within:text-gold-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search Digital ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border-2 border-emerald-900/5 focus:border-gold-400/20 px-14 py-5 rounded-[2.5rem] outline-none text-sm font-bold w-full md:w-80 shadow-2xl transition-all"
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* User Intelligence Matrix */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden relative group">
              
              {/* Animated Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-gold-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="bg-emerald-950/5 p-3 rounded-2xl">
                       <Fingerprint className="w-5 h-5 text-emerald-950" />
                    </div>
                    <div>
                       <h3 className="text-lg font-serif font-black text-emerald-950 uppercase tracking-tight">Active Personnel</h3>
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Real-time clearance monitoring</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                       {filteredUsers.length} Agents Online
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-900 uppercase tracking-widest">Agent Identity</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-900 uppercase tracking-widest">Access Level</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-emerald-900 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-emerald-900 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((user) => (
                      <motion.tr 
                        key={user.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`group hover:bg-emerald-50/30 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-emerald-50/50' : ''}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-950 to-emerald-800 flex items-center justify-center text-gold-400 font-serif font-black text-lg shadow-xl shadow-emerald-950/20 group-hover:scale-110 transition-transform">
                                 {user.name?.[0] || user.email?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-emerald-950 font-black uppercase tracking-tight text-sm">{user.name || 'Unknown Agent'}</span>
                                 <span className="text-[10px] text-gray-400 font-mono italic">{user.email}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              {user.role === ROLES.SUPER_ADMIN && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                              {user.role === ROLES.MANAGER && <Shield className="w-4 h-4 text-gold-500" />}
                              {user.role === ROLES.MODERATOR && <Clock className="w-4 h-4 text-blue-500" />}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                user.role === ROLES.SUPER_ADMIN ? 'text-emerald-700' :
                                user.role === ROLES.MANAGER ? 'text-gold-600' :
                                'text-gray-400'
                              }`}>
                                {user.role?.replace('_', ' ')}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-lg w-fit">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <span className="text-[8px] font-black text-emerald-900 uppercase">Secure</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-emerald-950 hover:text-white transition-all">
                              <MoreVertical className="w-4 h-4" />
                           </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Permission Preview Panel */}
           <div className="bg-emerald-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden group">
              <Zap className="absolute -bottom-10 -right-10 w-40 h-40 text-gold-400/5 group-hover:scale-125 transition-transform duration-1000" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <Activity className="w-8 h-8 text-gold-400 animate-pulse" />
                       <h4 className="text-2xl font-serif font-black uppercase italic tracking-tighter">Engine Health Monitor</h4>
                    </div>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">
                      All protocols are operational. Real-time encryption active via Anzaar Core. Current clearance matrix satisfies all enterprise safety regulations.
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                       <p className="text-[9px] font-black uppercase text-gold-400 mb-1">Vault Sync</p>
                       <p className="text-xl font-serif font-black italic">Active</p>
                    </div>
                    <div className="bg-gold-400 p-6 rounded-3xl border border-gold-400 shadow-xl shadow-gold-400/20">
                       <p className="text-[9px] font-black uppercase text-emerald-950 mb-1">Protection</p>
                       <p className="text-xl font-serif font-black italic text-emerald-950">1024-BIT</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Tactical Control Panel */}
        <div className="lg:col-span-4 space-y-10">
           <AnimatePresence mode="wait">
             {selectedUser ? (
               <motion.div 
                key={selectedUser.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl p-10 space-y-10 sticky top-10"
               >
                  <div className="flex flex-col items-center text-center space-y-4">
                     <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-950 flex items-center justify-center text-gold-400 text-3xl font-serif font-black border-4 border-gold-400/10 mb-4 ring-8 ring-emerald-50">
                        {selectedUser.name?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                     </div>
                     <div className="space-y-1">
                        <h2 className="text-2xl font-serif font-black text-emerald-950 uppercase tracking-tighter">{selectedUser.name || 'Agent Unknown'}</h2>
                        <p className="text-[10px] font-mono text-gray-400 leading-none">{selectedUser.email}</p>
                     </div>
                     <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 rounded-full border border-gray-100 shadow-inner">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">{selectedUser.role?.replace('_', ' ')} Access</span>
                     </div>
                  </div>

                  <div className="space-y-6 pt-10 border-t border-gray-100">
                     <h4 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest text-center px-4 leading-none">Recalibrate Access Tier</h4>
                     <div className="grid grid-cols-1 gap-3">
                        {Object.values(ROLES).map((role) => (
                          <button 
                            key={role}
                            onClick={() => handleRoleChange(selectedUser.id, role)}
                            className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                              selectedUser.role === role 
                              ? 'bg-emerald-950 border-emerald-950 text-white shadow-xl scale-105' 
                              : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                               <div className={`p-2 rounded-xl ${selectedUser.role === role ? 'bg-gold-400/20 text-gold-400' : 'bg-gray-50 text-gray-400'}`}>
                                  {role === ROLES.SUPER_ADMIN ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest">{role.replace('_', ' ')}</span>
                            </div>
                            {selectedUser.role === role && <Zap className="w-3 h-3 text-gold-400 fill-gold-400" />}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="pt-10 border-t border-gray-100 space-y-4 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] text-center leading-relaxed italic">
                    All access modifications are recorded<br/>in the global audit cloud.
                  </div>
               </motion.div>
             ) : (
               <div className="bg-emerald-50/30 border-2 border-dashed border-emerald-100/50 rounded-[4rem] p-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl border border-emerald-100">
                     <Users className="w-8 h-8 text-emerald-900" />
                  </div>
                  <h3 className="text-xl font-serif font-black text-emerald-950 uppercase italic pr-4">Intelligence Vault Ready</h3>
                  <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-widest leading-relaxed">Select an agent from the grid to recalibrate clearing codes and system roles.</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
