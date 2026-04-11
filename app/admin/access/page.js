"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteField } from 'firebase/firestore';
import { useAuth } from '../../../lib/auth-context';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '../../../lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Search, 
  Fingerprint, 
  Activity,
  Shield,
  Clock,
  Zap,
  Lock,
  RotateCcw,
  ShoppingBag,
  BarChart3,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccessControlPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const { userData: currentAdmin } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      setLoading(false);
      
      if (selectedUser) {
        const updated = userList.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    });
    return () => unsub();
  }, [selectedUser?.id]);

  const handleRoleChange = async (userId, newRole) => {
    if (currentAdmin?.role !== ROLES.SUPER_ADMIN) {
      toast.error("Access Denied: Super Admin clearance required.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Role recalibrated to ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error("Recalibration failed.");
    }
  };

  const togglePermission = async (userId, permissionKey) => {
    if (currentAdmin?.role !== ROLES.SUPER_ADMIN) {
      toast.error("Unauthorized protocol bypass attempt.");
      return;
    }
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const isCurrentlyAllowed = hasPermission(user, permissionKey);
    const newState = !isCurrentlyAllowed;
    try {
      const updates = {};
      updates[`customPermissions.${permissionKey}`] = newState;
      await updateDoc(doc(db, "users", userId), updates);
      toast.success(`${newState ? 'Granted' : 'Revoked'} access to ${permissionKey.replace('_', ' ')}`);
    } catch (err) {
      toast.error("Permission sync failed.");
    }
  };

  const resetPermissions = async (userId) => {
    const confirmation = window.confirm("Reset all custom overrides and revert to Role defaults?");
    if (!confirmation) return;
    try {
      await updateDoc(doc(db, "users", userId), { customPermissions: deleteField() });
      toast.info("Permissions reverted to Role standards.");
    } catch (err) {
      toast.error("Reset failed.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const permissionGroups = [
    {
      name: 'Tactical Operations',
      icon: ShoppingBag,
      perms: [
        { key: PERMISSIONS.VIEW_ORDERS, label: 'Monitor Orders', desc: 'Allows viewing the global order grid' },
        { key: PERMISSIONS.CREATE_ORDER, label: 'Initiate Order', desc: 'Allows placing new entry in the system' },
        { key: PERMISSIONS.UPDATE_ORDER_STATUS, label: 'Modulate Status', desc: 'Allows changing delivery/payment status' },
        { key: PERMISSIONS.DELETE_ORDER, label: 'Vaporize Order', desc: 'Allows moving orders to recovery vault' },
      ]
    },
    {
      name: 'Vault Management',
      icon: Package,
      perms: [
        { key: PERMISSIONS.VIEW_VAULT, label: 'Scan Vault', desc: 'Allows browsing the product inventory' },
        { key: PERMISSIONS.ADD_PRODUCT, label: 'Materialize Product', desc: 'Allows adding new items to vault' },
        { key: PERMISSIONS.EDIT_PRODUCT, label: 'Recalibrate Gear', desc: 'Allows editing product specs/variants' },
        { key: PERMISSIONS.DELETE_PRODUCT, label: 'Archival Protocol', desc: 'Allows deleting items from catalog' },
      ]
    },
    {
      name: 'Intelligence & Data',
      icon: BarChart3,
      perms: [
        { key: PERMISSIONS.VIEW_REPORTS, label: 'Visual Intelligence', desc: 'Allows viewing sales/trend charts' },
        { key: PERMISSIONS.EXPORT_DATA, label: 'Data Extraction', desc: 'Allows exporting sheets and csv' },
      ]
    },
    {
      name: 'System Framework',
      icon: Shield,
      perms: [
        { key: PERMISSIONS.MANAGE_USERS, label: 'Governance', desc: 'Allows managing agents and clearances' },
        { key: PERMISSIONS.EDIT_SETTINGS, label: 'Core Config', desc: 'Allows altering branding and API keys' },
        { key: PERMISSIONS.VIEW_TRASH, label: 'Recovery Access', desc: 'Allows viewing the recycle bin' },
        { key: PERMISSIONS.PURGE_TRASH, label: 'Permanent Destruction', desc: 'Allows instant vaporizing of trash' },
      ]
    }
  ];

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8 space-y-4">
       <div className="w-16 h-16 border-4 border-zinc-950/10 border-t-zinc-950 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-20 px-4 md:px-0">
            {/* Header */}
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pt-4">
         <div className="space-y-3">
           <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white text-zinc-950 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-black/5 shadow-sm flex items-center gap-2">
                 <Fingerprint className="w-3.5 h-3.5" />
                 Access Matrix
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white border border-black/5 px-4 py-2 rounded-full shadow-sm">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">Connected</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Security <span className="text-zinc-300">Hub</span></h1>
           <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.3em] max-w-xl">Calibrate micro-permissions and system clearances for personnel.</p>
         </div>

         <div className="relative group w-full xl:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
            <input type="text" placeholder="Personnel Digital ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white border border-black/5 px-14 py-5 rounded-[2.5rem] outline-none text-[10px] font-black uppercase tracking-[0.2em] w-full shadow-xl text-zinc-950 placeholder:text-zinc-200" />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[3rem] border border-black/5 shadow-xl overflow-hidden flex flex-col h-fit">
               <div className="p-8 border-b border-black/5 bg-zinc-50">
                  <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Digital Roster</h3>
               </div>
               <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                 {filteredUsers.map((user) => (
                   <button key={user.id} onClick={() => setSelectedUser(user)} className={`w-full flex items-center gap-5 p-6 border-b border-black/5 transition-all text-left group ${selectedUser?.id === user.id ? 'bg-zinc-950 text-white' : 'hover:bg-zinc-50 text-zinc-950'}`}>
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${selectedUser?.id === user.id ? 'bg-white text-zinc-950' : 'bg-zinc-100 text-zinc-400'}`}>
                        {user.name?.[0] || user.email?.[0]?.toUpperCase()}
                     </div>
                     <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-tight truncate block">{user.name || 'Anonymous Operative'}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${selectedUser?.id === user.id ? 'text-white/40' : 'text-zinc-300'}`}>{user.role?.replace('_', ' ')}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 text-zinc-950 space-y-6 relative overflow-hidden group shadow-xl">
               <h4 className="text-zinc-300 text-[9px] font-black uppercase tracking-[0.3em]">Operational Status</h4>
               <p className="font-black text-2xl pr-8 uppercase tracking-tighter leading-none">Encryption layers synched with <span className="text-zinc-300">Vortex-Core</span>.</p>
            </div>
         </div>

         <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedUser ? (
                <motion.div key={selectedUser.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="bg-white rounded-[4rem] border border-black/5 shadow-2xl p-10 flex flex-col md:flex-row items-center gap-10">
                       <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-950 flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-transform group-hover:scale-105">
                          {selectedUser.name?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                       </div>
                       <div className="flex-1 text-center md:text-left">
                          <h2 className="text-3xl font-black text-zinc-950 tracking-tighter uppercase leading-none">{selectedUser.name || 'Personnel Profile'}</h2>
                          <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] mt-3">{selectedUser.email}</p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                             <div className="px-5 py-2.5 bg-zinc-950 text-white rounded-full flex items-center gap-3 shadow-xl">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{selectedUser.role?.replace('_', ' ')}</span>
                             </div>
                             <button onClick={() => resetPermissions(selectedUser.id)} className="px-5 py-2.5 bg-zinc-50 border border-black/5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-full flex items-center gap-3 transition-all">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Reset</span>
                             </button>
                          </div>
                       </div>
                    </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {permissionGroups.map((group, gIdx) => (
                        <div key={gIdx} className="bg-white rounded-[3rem] border border-black/5 shadow-xl overflow-hidden flex flex-col">
                           <div className="p-8 bg-zinc-50 border-b border-black/5 flex items-center gap-4">
                              <group.icon className="w-4 h-4 text-zinc-950" />
                              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{group.name}</h4>
                           </div>
                           <div className="p-6 space-y-4">
                               {group.perms.map((perm, pIdx) => {
                                  const isPermitted = hasPermission(selectedUser, perm.key);
                                  return (
                                    <div key={pIdx} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${isPermitted ? 'bg-white border-black/5 shadow-sm' : 'bg-zinc-50/50 border-black/5 opacity-40'}`}>
                                       <div className="flex-1">
                                          <span className={`text-[10px] font-black uppercase tracking-tight block ${isPermitted ? 'text-zinc-950' : 'text-zinc-300'}`}>{perm.label}</span>
                                          <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mt-2">{perm.desc}</p>
                                       </div>
                                       <button onClick={() => togglePermission(selectedUser.id, perm.key)} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isPermitted ? 'bg-zinc-950' : 'bg-zinc-200'}`}>
                                          <div className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ${isPermitted ? 'right-1 bg-white' : 'left-1 bg-white'}`} />
                                       </button>
                                    </div>
                                  );
                               })}
                           </div>
                        </div>
                      ))}
                   </div>

                    <div className="bg-white rounded-[3.5rem] border border-black/5 shadow-2xl p-10">
                       <h4 className="text-xl font-black text-zinc-950 uppercase tracking-tighter mb-10">Recalibrate Access Tier</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                          {Object.values(ROLES).filter(r => r !== 'banned').map((role) => (
                             <button key={role} onClick={() => handleRoleChange(selectedUser.id, role)} className={`p-8 rounded-[2rem] border transition-all flex flex-col gap-3 group ${selectedUser.role === role ? 'bg-zinc-950 border-zinc-950 text-white shadow-2xl scale-105' : 'bg-zinc-50 border-black/5 text-zinc-300 hover:bg-white hover:text-zinc-950 hover:border-black/5 transition-all'}`}>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{role.replace('_', ' ')}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                </motion.div>
             ) : (
                 <div className="bg-white border border-black/5 rounded-[5rem] p-40 text-center shadow-xl">
                    <h3 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter mb-3">Personnel Required</h3>
                    <p className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">Select an operative from the digital roster to begin system recalibration.</p>
                 </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
