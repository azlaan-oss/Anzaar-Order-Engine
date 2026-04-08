"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard, 
  Truck, 
  Package, 
  History as HistoryIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { logActivity } from '../lib/logger';
import { updateOrder } from '../lib/firebase-utils';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

export default function OrderDetailModal({ order, onClose }) {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!order?.orderId) return;
    
    // Live listener for history to reflect updates immediately
    const q = query(
      collection(db, "activity_logs"),
      where("details.orderId", "==", order.orderId),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const logs = [];
      snap.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setActivityLogs(logs);
      setLoadingHistory(false);
    }, (err) => {
      console.error("History sync err:", err);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [order?.orderId]);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === order.status) return;
    setUpdatingStatus(true);
    const toastId = toast.loading(`Transitioning order to ${newStatus}...`);
    
    try {
      await updateOrder(order.id, { status: newStatus });
      await logActivity("Moderator", `Updated Status to ${newStatus}`, { 
        orderId: order.orderId, 
        previousStatus: order.status || 'pending',
        newStatus: newStatus 
      });
      toast.success("Protocol updated successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to update system protocol", { id: toastId });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!order || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-10 custom-scrollbar">
           <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <span className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Order Intelligence</span>
                   {order.isUrgent && <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-red-100 animate-pulse">Urgent</span>}
                </div>
                <h2 className="text-4xl font-serif font-black text-emerald-950">ID: #{order.orderId}</h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Processed on {new Date(order.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                 <X className="w-6 h-6" />
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Capsule */}
              <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50 space-y-4">
                 <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Customer Profile
                 </h4>
                 <div className="space-y-3">
                    <p className="text-2xl font-serif font-black text-emerald-950">{order.customer.name}</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                       <Phone className="w-4 h-4 opacity-40" /> {order.customer.phone}
                    </div>
                    <div className="flex items-start gap-2 text-sm font-medium text-gray-500 pt-2">
                       <MapPin className="w-4 h-4 opacity-40 mt-1 shrink-0" /> {order.customer.address}
                    </div>
                 </div>
              </div>

              {/* Finance Capsule */}
              <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-3 h-3" /> Financial Verdict
                 </h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-200/50 pb-4">
                       <span className="text-sm font-bold text-gray-400 uppercase">Gross Total</span>
                       <span className="text-3xl font-black text-emerald-950">৳ {order.totals.total}</span>
                    </div>
                    {order.totals.due > 0 ? (
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                         <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-xs font-black text-red-900 uppercase tracking-widest">Pending Due</span>
                         </div>
                         <span className="text-lg font-black text-red-600">৳ {order.totals.due}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                         <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-widest">Fully Settled</span>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Items Suite */}
           <div className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Breakdown of Elegance</h4>
              <div className="space-y-4">
                 {order.items.map((item, idx) => (
                   <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                            <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                         </div>
                         <div>
                            <h5 className="font-serif font-black text-emerald-950 group-hover:text-emerald-700 transition-colors uppercase">{item.name}</h5>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.size} • {item.color}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">x{item.quantity}</p>
                         <p className="text-lg font-black text-emerald-950">৳ {item.price * item.quantity}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="pt-10 space-y-3">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">End of Order Specification</p>
           </div>
        </div>

        {/* History Sidebar */}
        <div className="w-full md:w-80 bg-gray-50/50 border-l border-gray-100 p-8 flex flex-col">
           <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-950 text-white p-2 rounded-xl">
                 <HistoryIcon className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-xl text-emerald-950">Lifecycle</h3>
           </div>

           <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar relative pr-2">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              {loadingHistory ? (
                <div className="space-y-6 animate-pulse p-4">
                   {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-20 text-gray-300">
                   <Clock className="w-10 h-10 mx-auto opacity-20 mb-3" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">No detailed logs</p>
                </div>
              ) : (
                activityLogs.map((log, i) => (
                  <div key={log.id} className="relative pl-10">
                     <div className="absolute left-3 top-1 w-2.5 h-2.5 rounded-full bg-emerald-900 border-4 border-white shadow-sm z-10" />
                     <div className="space-y-1">
                        <p className="text-xs font-black text-emerald-950 uppercase tracking-tight">{log.action}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{log.user}</p>
                        <p className="text-[8px] font-medium text-gray-400 italic mt-2">
                          {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : 'Recent'}
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>

           <div className="mt-8 pt-8 border-t border-gray-200 space-y-6">
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Master Controls</p>
                 <select 
                  value={order.status || 'pending'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-900/10 transition-all disabled:opacity-50"
                 >
                    <option value="pending">Pending Review</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="canceled">Canceled</option>
                 </select>
              </div>

              <div className="flex items-center gap-2 bg-emerald-950 text-gold-400 p-4 rounded-2xl shadow-xl">
                 <Package className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Status: {order.status?.toUpperCase() || 'PENDING'}</span>
              </div>
           </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
