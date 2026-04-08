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
  AlertCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { logActivity } from '../lib/logger';
import { updateOrder, getCustomerOrderStats, moveToTrash } from '../lib/firebase-utils';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { toJpeg } from 'html-to-image';
import InvoiceTemplate from './InvoiceTemplate';
import { Download, RefreshCw } from 'lucide-react';

export default function OrderDetailModal({ order, onClose }) {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [customerStats, setCustomerStats] = useState({ totalSpent: 0, orderCount: 0 });

  useEffect(() => {
    setMounted(true);
    if (!order?.orderId) return;
    
    const fetchCustomerData = async () => {
      if (order.customer?.phone) {
        const stats = await getCustomerOrderStats(order.customer.phone);
        setCustomerStats(stats);
      }
    };
    fetchCustomerData();

    // Live listener for history...
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

  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = React.useRef(null);

  const downloadInvoice = async () => {
    if (!invoiceRef.current) {
        console.error("Invoice Ref is null!");
        return;
    }
    
    setIsGenerating(true);
    const toastId = toast.loading("Generating High-Res Invoice...");

    try {
      // 1000ms delay to ensure all assets/images are loaded for the JPG capture
      await new Promise(r => setTimeout(r, 1000));
      
      const dataUrl = await toJpeg(invoiceRef.current, { 
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true
      });
      
      // Convert to Blob for safer download on all platforms
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const safeName = order.customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `anzaar-${order.orderId}-${safeName}.jpg`;
      link.href = blobUrl;
      link.click();
      
      URL.revokeObjectURL(blobUrl);
      toast.success("Invoice recovered and downloaded!", { id: toastId });
    } catch (err) {
      console.error("Archive Download Error:", err);
      toast.error("Failed to recover invoice JPG", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure? This order will be moved to Trash for 7 days before permanent deletion.")) {
      try {
        await moveToTrash("orders", order.id);
        toast.success("Order moved to Trash vault");
        onClose();
      } catch (err) {
        toast.error("Cleanup failed: " + err.message);
      }
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
        className="absolute inset-0 bg-emerald-950/80"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-5xl h-[92vh] md:h-full md:max-h-[85vh] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row mt-auto md:mt-0"
      >
        {/* Main Content Area */}
         <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-10 custom-scrollbar">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 overflow-hidden">
               <div className="min-w-0 pr-12 sm:pr-0">
                 <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Order Details</span>
                    {order.isUrgent && <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-2 py-1 rounded-full border border-red-100 animate-pulse">Urgent</span>}
                 </div>
                 <h2 className="text-2xl sm:text-4xl font-serif font-black text-emerald-950 truncate">ID: #{order.orderId}</h2>
                 <p className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1">Date: {new Date(order.timestamp).toLocaleString()}</p>
               </div>
               <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                  <button 
                   onClick={handleDelete}
                   className="flex-1 sm:flex-none p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm flex items-center justify-center"
                   title="Move to Trash"
                  >
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={onClose} className="flex-1 sm:flex-none p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all shadow-sm flex items-center justify-center">
                     <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
               </div>
            </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Capsule */}
               <div className="bg-emerald-50/50 p-6 sm:p-8 rounded-[2rem] border border-emerald-100/50 space-y-6">
                  <div className="flex justify-between items-start">
                     <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" /> Customer Info
                     </h4>
                     <div className="bg-emerald-900 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                        {customerStats.orderCount > 1 ? 'Returning' : 'New'}
                     </div>
                  </div>
                  <div className="space-y-3">
                     <p className="text-xl sm:text-2xl font-serif font-black text-emerald-950">{order.customer.name}</p>
                     <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                        <Phone className="w-4 h-4 opacity-40" /> {order.customer.phone}
                     </div>
                     <div className="flex items-start gap-2 text-sm font-medium text-gray-500 pt-2">
                        <MapPin className="w-4 h-4 opacity-40 mt-1 shrink-0" /> {order.customer.address}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-100/50">
                     <div>
                        <p className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest">Total Orders</p>
                        <p className="text-base sm:text-lg font-black text-emerald-950">{customerStats.orderCount}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest">Total Spent</p>
                        <p className="text-base sm:text-lg font-black text-emerald-950">৳ {customerStats.totalSpent.toLocaleString()}</p>
                     </div>
                  </div>
               </div>

              {/* Finance Capsule */}
               <div className="bg-gray-50 p-6 sm:p-8 rounded-[2rem] border border-gray-100 space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <CreditCard className="w-3 h-3" /> Payment Details
                  </h4>
                  <div className="space-y-4">
                     <div className="flex justify-between items-end border-b border-gray-200/50 pb-4">
                        <span className="text-sm font-bold text-gray-400 uppercase">Total Amount</span>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-950">৳ {order.totals.total}</span>
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
        <div className="w-full md:w-80 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100 p-8 sm:p-12 flex flex-col shrink-0">
           <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-950 text-white p-2 rounded-xl">
                 <HistoryIcon className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-black text-xl text-emerald-950 uppercase tracking-tight">Order History</h3>
           </div>

           <div className="flex-1 md:overflow-y-auto space-y-8 custom-scrollbar relative pr-2">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              {loadingHistory ? (
                <div className="space-y-6 animate-pulse p-4">
                   {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-20 text-gray-300">
                   <Clock className="w-10 h-10 mx-auto opacity-20 mb-3" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">No activity history found</p>
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
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Update Status</p>
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

              <button 
               type="button"
               onClick={downloadInvoice}
               disabled={isGenerating}
               className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-900 hover:bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                 {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                 Download Invoice
              </button>
           </div>
        </div>
         {/* Hidden Template for Image Generation */}
         <div className="fixed top-[-10000px] left-[-10000px] opacity-0 pointer-events-none">
            <InvoiceTemplate ref={invoiceRef} order={order} />
         </div>
      </motion.div>
    </div>,
    document.body
  );
}
