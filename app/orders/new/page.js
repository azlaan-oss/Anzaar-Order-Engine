"use client";

import React, { useRef, useState } from 'react';
import OrderForm from '../../../components/OrderForm';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toJpeg } from 'html-to-image';
import InvoiceTemplate from '../../../components/InvoiceTemplate';
import OrderSuccessModal from '../../../components/OrderSuccessModal';
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
      // Small delay to ensure render
      await new Promise(r => setTimeout(r, 800));
      const dataUrl = await toJpeg(invoiceRef.current, { 
        quality: 0.95,
        backgroundColor: '#fff',
        pixelRatio: 2 // High resolution for mobile
      });
      const link = document.createElement('a');
      link.download = `anzaar-invoice-${order.customer.name.replace(/\s+/g, '-')}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("Invoice downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice image", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOrderSuccess = (orderData) => {
    setLastOrder(orderData);
    // Don't auto-download, let the user decide in the modal
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4 sm:px-0">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft className="w-6 h-6 text-emerald-950" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-black text-emerald-950 tracking-tighter">Create New Order</h1>
            <p className="text-gray-500 font-medium text-xs uppercase tracking-widest">Smart Moderator Environment</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
           <Sparkles className="w-4 h-4 text-emerald-900" />
           <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest">Pricing Intelligence Active</span>
        </div>
      </div>

      {/* Main Order Form */}
      <OrderForm onSuccess={handleOrderSuccess} />

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {lastOrder && (
          <OrderSuccessModal 
            order={lastOrder} 
            onClose={() => setLastOrder(null)} 
            onDownloadInvoice={() => downloadInvoice(lastOrder)}
          />
        )}
      </AnimatePresence>

      {/* Hidden Invoice Anchor for Capture */}
      <div className="fixed top-[-10000px] left-[-10000px] opacity-0 pointer-events-none">
        <InvoiceTemplate ref={invoiceRef} order={lastOrder} />
      </div>
    </div>
  );
}
