"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShoppingBag,
  ArrowLeft,
  Search,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PublicTrackingPage({ params }) {
  const { id } = params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder(docSnap.data());
        } else {
          setError("Order sequence not found in our secure vaults.");
        }
      } catch (err) {
        setError("Network encryption error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
       <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-emerald-950 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950/40 italic">Decrypting Order Genesis...</p>
       </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
       <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Search className="w-10 h-10" />
       </div>
       <h1 className="text-2xl font-serif font-black text-emerald-950 mb-2">Vault Search Failed</h1>
       <p className="text-gray-400 mb-8 max-w-xs">{error}</p>
       <Link href="/" className="px-8 py-4 bg-emerald-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Return to Hub</Link>
    </div>
  );

  const steps = [
    { label: 'Confirmed', icon: CheckCircle2, status: 'completed', date: order.timestamp },
    { label: 'Processing', icon: Clock, status: order.shipmentStatus === 'Processing' || order.shipmentStatus === 'Shipped' || order.shipmentStatus === 'Delivered' ? 'completed' : 'active' },
    { label: 'Shipped', icon: Truck, status: order.shipmentStatus === 'Shipped' || order.shipmentStatus === 'Delivered' ? 'completed' : 'pending' },
    { label: 'Delivered', icon: Package, status: order.shipmentStatus === 'Delivered' ? 'completed' : 'pending' }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Premium Tracking Header */}
      <div className="bg-emerald-950 text-white pt-16 pb-32 px-6 relative overflow-hidden">
         <div className="max-w-xl mx-auto relative z-10 space-y-2 text-center">
            <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 mb-4 animate-pulse">
               Live Telemetry Active
            </div>
            <h1 className="text-4xl font-serif font-black tracking-tightest">anzaar Tracker</h1>
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest leading-relaxed">
               Verified Order: <span className="text-gold-400 font-black">#{order.orderId}</span>
            </p>
         </div>
         
         {/* Background Orbs */}
         <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-800/30 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-emerald-900/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-xl mx-auto -mt-16 px-6 space-y-6">
         {/* Tracking Pulse Grid */}
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100"
         >
            <div className="space-y-12">
               {steps.map((step, idx) => (
                 <div key={idx} className="flex gap-6 relative">
                    {idx !== steps.length - 1 && (
                      <div className={`absolute left-[23px] top-[46px] w-[2px] h-[calc(100%+24px)] ${
                        step.status === 'completed' ? 'bg-emerald-950' : 'bg-gray-100'
                      }`} />
                    )}
                    
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-500 ${
                      step.status === 'completed' ? 'bg-emerald-950 text-gold-400 shadow-xl shadow-emerald-950/20' : 
                      step.status === 'active' ? 'bg-amber-50 text-amber-600 border-2 border-amber-200 animate-pulse' :
                      'bg-gray-50 text-gray-300'
                    }`}>
                       <step.icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 pt-1">
                       <h3 className={`font-black text-sm uppercase tracking-widest ${
                         step.status === 'completed' ? 'text-emerald-950' : 'text-gray-400'
                       }`}>
                         {step.label}
                       </h3>
                       <p className="text-[10px] font-bold text-gray-400 mt-1 italic">
                          {step.status === 'completed' ? (step.date ? new Date(step.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : 'Verified Action') : (step.status === 'active' ? 'In Progress' : 'Pending Deployment')}
                       </p>
                    </div>
                 </div>
               ))}
            </div>
         </motion.div>

         {/* Order Preview Summary */}
         <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
               <ShoppingBag className="w-5 h-5 text-emerald-950" />
               <h3 className="font-serif font-black text-emerald-950 uppercase tracking-tight">Receipt Overview</h3>
            </div>

            <div className="space-y-4">
               {order.items.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-4">
                    <img src={item.image} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-inner" alt="" />
                    <div className="flex-1">
                       <p className="text-xs font-black text-emerald-950 leading-tight uppercase">{item.name}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.color} • {item.size}</p>
                    </div>
                    <p className="text-sm font-black text-emerald-950">৳ {item.price}</p>
                 </div>
               ))}
            </div>

            <div className="pt-4 border-t border-gray-50 space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery To</span>
                    <span className="text-xs font-black text-emerald-950">{order.customer.address.split(',').pop()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Security</span>
                    <span className="text-xs font-black text-emerald-950 italic">{order.payment.method} Locked</span>
                 </div>
            </div>
         </div>

         {/* Trust Footer */}
         <div className="text-center space-y-4 pt-4">
            <div className="flex items-center justify-center gap-2">
               <Sparkles className="w-4 h-4 text-emerald-950/20" />
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-950/30">anzâar premium luxury</p>
            </div>
         </div>
      </div>
    </div>
  );
}
