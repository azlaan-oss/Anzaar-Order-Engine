import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) setSettings(snap.data());
    };
    fetchSettings();
  }, []);

  if (!order) return null;

  const { customer, items, totals, timestamp } = order;
  const date = new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      ref={ref}
      className="w-[800px] bg-white p-20 text-zinc-950 font-sans relative overflow-hidden"
      style={{ minHeight: '1131px' }} // A4 Ratio
    >
      {/* Subtle Background Mark */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-zinc-50 rounded-full blur-[120px] -z-10 opacity-50" />
      
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-16">
        {settings?.logoUrl && (
          <div className="mb-6">
            <img 
              src={settings.logoUrl} 
              className="h-20 w-auto object-contain transition-all duration-700" 
              alt="Brand Logo" 
            />
          </div>
        )}
        <h1 className="text-3xl font-black uppercase tracking-[0.3em] text-zinc-900 leading-none">
          {settings?.brandName || 'ANZAAR'}
        </h1>
        <div className="h-px w-12 bg-zinc-200 my-4 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Official Invoice</p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-20 mb-16 border-y border-zinc-100 py-12">
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-2">Billed To</p>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{customer.name}</h2>
            <p className="text-sm font-bold text-zinc-500 mt-1">{customer.phone}</p>
          </div>
          <div className="pt-2">
            <p className="text-xs text-zinc-400 leading-relaxed font-medium uppercase tracking-wider">{customer.address}</p>
          </div>
        </div>

        <div className="text-right space-y-6">
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Order ID</p>
             <p className="text-lg font-black text-zinc-900 leading-none">#{order.orderId || 'PENDING'}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Issue Date</p>
             <p className="text-sm font-bold text-zinc-900">{date}</p>
          </div>
          <div className="inline-block px-4 py-2 bg-zinc-900 rounded-full">
             <p className="text-[9px] font-black uppercase tracking-widest text-white">Status: {order.status || 'Confirmed'}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1">
        <table className="w-full">
          <thead>
            <tr className="text-[9px] font-black uppercase tracking-widest text-zinc-300 text-left border-b border-zinc-100">
              <th className="pb-4 pl-4">Description</th>
              <th className="pb-4 text-center">Qty</th>
              <th className="pb-4 text-right">Price</th>
              <th className="pb-4 text-right pr-4">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {items.map((item, idx) => (
              <tr key={idx} className="group">
                <td className="py-8 pl-4">
                  <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">{item.name}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full border border-zinc-200" />
                    {item.color} • {item.size} • SKU: {item.sku}
                  </p>
                </td>
                <td className="py-8 text-center text-sm font-black text-zinc-900">{item.quantity}</td>
                <td className="py-8 text-right text-sm font-bold text-zinc-500">৳{item.price.toLocaleString()}</td>
                <td className="py-8 text-right text-sm font-black text-zinc-900 pr-4">৳{(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="mt-20 flex justify-between items-end">
        {/* Verification / Branding */}
        <div className="space-y-4 max-w-[300px]">
           <p className="text-[9px] font-bold text-zinc-300 leading-relaxed uppercase tracking-widest italic">
             Thank you for your order. We appreciate your preference for exceptional quality and timeless design.
           </p>
           <div className="flex items-center gap-3 grayscale opacity-30">
              <div className="w-10 h-10 border border-zinc-200 rounded-lg flex items-center justify-center p-1">
                 {/* Empty box for potential QR code placeholder */}
                 <div className="w-full h-full bg-zinc-100 rounded-sm" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">
                Verified Authentic<br/>Anzaar Official
              </p>
           </div>
        </div>

        {/* Totals Breakdown */}
        <div className="w-80 space-y-4">
          <div className="bg-zinc-50 p-8 rounded-[2.5rem] space-y-4 shadow-sm border border-zinc-100/50">
            <div className="flex justify-between items-center px-2">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gross Subtotal</span>
               <span className="text-sm font-black text-zinc-900">৳{totals.subtotal.toLocaleString()}</span>
            </div>
            
            {totals.discount > 0 && (
              <div className="flex justify-between items-center px-2 text-rose-500 font-black">
                 <span className="text-[10px] uppercase tracking-widest">Promotion Applied</span>
                 <span className="text-sm">- ৳{totals.discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center px-2">
               <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Logistics Fee</span>
               <span className="text-sm font-black text-zinc-900">৳{totals.delivery.toLocaleString()}</span>
            </div>

            <div className="h-px bg-zinc-200/50 mx-2" />

            <div className="flex justify-between items-center px-2 pt-2">
               <span className="text-[11px] font-black text-zinc-950 uppercase tracking-[0.2em]">Grand Total</span>
               <span className="text-2xl font-black text-zinc-900 tracking-tighter">৳{totals.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50 text-center">
               <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Cleared</p>
               <p className="text-sm font-black text-emerald-600 tracking-tight">৳{totals.paid.toLocaleString()}</p>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100/50 text-center">
               <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Outstanding</p>
               <p className="text-sm font-black text-rose-600 tracking-tight">৳{totals.due.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Footer */}
      <div className="absolute bottom-10 left-0 right-0 text-center opacity-30">
        <p className="text-[7px] font-black uppercase tracking-[1em] text-zinc-400">
          Electronic Document Protocol • No Signature Required
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
