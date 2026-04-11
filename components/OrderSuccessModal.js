import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  MessageSquare, 
  Download, 
  ExternalLink, 
  X, 
  Copy,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrderSuccessModal({ order, onClose, onDownloadInvoice }) {
  if (!order) return null;

  const trackingUrl = `${window.location.origin}/track/${order.id}`;
  
  const handleWhatsAppShare = () => {
    const phoneNumber = order.customer.phone.replace(/\D/g, '');
    const message = `Salam ${order.customer.name}!
Your order #${order.orderId} from *anzaar* has been confirmed.
Total Amount: ৳${order.totals.total}
Remaining Due: ৳${order.totals.due}

You can track your order live here:
${trackingUrl}

Thank you for choosing luxury.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/88${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  const copyTracking = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success("Tracking link copied!");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-black/5"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-900"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12 text-center space-y-6">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           
           <div className="space-y-2">
              <h2 className="text-3xl font-serif font-black text-zinc-950 tracking-tight">Luxury Order Placed</h2>
              <p className="text-gray-500 font-medium">Order ID: <span className="text-zinc-900 font-bold">#{order.orderId}</span></p>
           </div>

           <div className="bg-zinc-50 rounded-3xl p-6 space-y-4 text-left border border-black/5">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Recipient</span>
                 <span className="text-zinc-950 font-black">{order.customer.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                 <span className="text-zinc-950 font-black text-lg">৳ {order.totals.total}</span>
              </div>
              <div className="pt-3 border-t border-black/5 flex items-center gap-2">
                 <div className="flex-1 bg-zinc-100 border border-black/5 px-3 py-2 rounded-xl text-[10px] text-zinc-400 font-mono truncate">
                    {trackingUrl}
                 </div>
                 <button onClick={copyTracking} className="p-2 bg-white text-zinc-950 rounded-xl hover:bg-zinc-50 transition-colors border border-black/5 shadow-sm">
                    <Copy className="w-4 h-4" />
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-500/10 active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
                WhatsApp Share
              </button>
              <button 
                onClick={onDownloadInvoice}
                className="flex items-center justify-center gap-2 bg-zinc-950 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-zinc-950/20 active:scale-95"
              >
                <Download className="w-5 h-5" />
                Get Invoice
              </button>
           </div>

           <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Info className="w-3 h-3" />
              Automated sync complete
           </div>
        </div>
      </motion.div>
    </div>
  );
}
