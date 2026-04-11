"use client";

export const dynamic = "force-dynamic";

import React, { useRef, useState } from 'react';
import OrderForm from '../../../components/OrderForm';
import { ArrowLeft, FileText, Download, CheckCircle2, Share2, Sparkles, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { toJpeg } from 'html-to-image';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function NewOrderPage() {
  const invoiceRef = useRef(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadInvoice = async (order) => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Generating Luxury Invoice...");

    try {
      // Small delay to ensure render of hidden template with new data
      await new Promise(r => setTimeout(r, 1500));
      
      const dataUrl = await toJpeg(invoiceRef.current, { 
        quality: 0.95,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      
      // Convert to Blob for safer download on all platforms
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const safeName = order.customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `anzaar-${order.orderId || 'new'}-${safeName}.jpg`;
      link.href = blobUrl;
      link.click();
      
      URL.revokeObjectURL(blobUrl);
      toast.success("Invoice downloaded as JPG!", { id: toastId });
    } catch (err) {
      console.error("Invoice Error:", err);
      toast.error("Generation failed. Please try 'Download Again'.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOrderSuccess = (orderData) => {
    setLastOrder(orderData);
    downloadInvoice(orderData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-zinc-950/20 rounded-full transition-all">
            <ArrowLeft className="w-6 h-6 text-zinc-950" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-zinc-950 tracking-tight">Create New Order</h1>
            <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Anzaar-Vortex Console Environment</p>
          </div>
        </div>
        
      </div>

      {/* Main Order Form */}
      {!lastOrder ? (
        <OrderForm onSuccess={handleOrderSuccess} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto bg-white p-12 rounded-[40px] border border-black/5 shadow-2xl text-center space-y-8"
        >
          <div className="w-20 h-20 bg-zinc-950 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-zinc-950/20">
             <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Order Confirmed!</h2>
            <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">The secure invoice has been encrypted and downloaded.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <button 
               onClick={() => downloadInvoice(lastOrder)}
               className="flex items-center justify-center gap-2 p-4 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
              >
                <Download className="w-5 h-5" />
                Download Again
              </button>
              <button 
               onClick={() => setLastOrder(null)}
               className="flex items-center justify-center gap-2 p-4 bg-zinc-50 text-zinc-950 border border-black/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all shadow-sm active:scale-95"
              >
                 <PlusCircle className="w-5 h-5" />
                 New Entry
              </button>
          </div>

          <div className="pt-8 border-t border-gray-50 flex items-center justify-center gap-4 text-gray-400 text-sm">
             <Share2 className="w-4 h-4" />
             Ready to share via WhatsApp or Messenger
          </div>
        </motion.div>
      )}

      {/* Hidden Invoice Anchor for Capture */}
      <div className="fixed top-[-10000px] left-[-10000px] opacity-0 pointer-events-none">
        <InvoiceTemplate ref={invoiceRef} order={lastOrder} />
      </div>
    </div>
  );
}
