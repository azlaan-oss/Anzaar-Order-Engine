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
    month: 'short',
    year: 'numeric'
  });

  return (
    <div 
      ref={ref}
      className="w-[800px] bg-white p-12 text-zinc-950 font-sans"
      style={{ minHeight: '1000px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-black/5 pb-8">
        <div className="flex items-center gap-6">
           {settings?.logoUrl && (
              <div className="w-24 h-24 bg-white rounded-2xl p-2 overflow-hidden flex items-center justify-center border border-black/5 shadow-sm">
                 <img src={settings.logoUrl} className="max-w-full max-h-full object-contain" alt="Brand Logo" />
              </div>
           )}
           <div>
              <h1 className="text-4xl font-bold tracking-tightest uppercase leading-none">{settings?.brandName || 'anzaar'}</h1>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-400 mt-2">Order Invoice</p>
           </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Date</p>
          <p className="font-bold">{date}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-12 grid grid-cols-2 gap-12">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-2">Customer Details</p>
          <h2 className="text-xl font-black text-zinc-950">{customer.name}</h2>
          <p className="text-sm mt-1 font-bold text-zinc-600">{customer.phone}</p>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-[250px]">{customer.address}</p>
        </div>
        <div className="text-right">
           <p className="text-[9px] font-black uppercase tracking-widest text-zinc-300 mb-2">Order Summary</p>
           <p className="text-xs font-black uppercase tracking-widest">Status: <span className="text-emerald-600">PAID (ADV)</span></p>
            {order.payment.advancePaid && (
               <div className="mt-2 flex items-center justify-end gap-3">
                 <div className="text-right">
                   <p className="text-[9px] text-zinc-300 font-black uppercase">Transaction ID</p>
                   <p className="text-[10px] font-black text-zinc-950">{order.payment.transactionId}</p>
                 </div>
                 {order.payment.proofUrl && (
                   <img src={order.payment.proofUrl} className="w-12 h-12 rounded-lg border border-black/5 object-cover" />
                 )}
               </div>
            )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full mt-12">
        <thead>
          <tr className="border-b border-black/5 text-[9px] font-black uppercase tracking-widest text-left text-zinc-300">
            <th className="py-4">Item Description</th>
            <th className="py-4 text-center">Qty</th>
            <th className="py-4 text-right">Price</th>
            <th className="py-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.02]">
          {items.map((item, idx) => (
             <tr key={idx} className="text-xs text-zinc-950">
               <td className="py-6">
                 <p className="font-black uppercase tracking-tight">{item.name}</p>
                 <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider mt-1">{item.color} • SKU: {item.sku}</p>
               </td>
               <td className="py-6 text-center font-bold">{item.quantity}</td>
               <td className="py-6 text-right font-bold">৳ {item.price}</td>
               <td className="py-6 text-right font-black">৳ {item.price * item.quantity}</td>
             </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
       {/* Totals */}
       <div className="mt-12 flex justify-end">
         <div className="w-64 space-y-3">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-300">
             <span>Subtotal</span>
             <span className="text-zinc-950">৳ {totals.subtotal}</span>
           </div>
           {totals.discount > 0 && (
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-500">
               <span>Discount</span>
               <span>- ৳ {totals.discount}</span>
             </div>
           )}
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-300">
             <span>Delivery Fee</span>
             <span className="text-zinc-950">+ ৳ {totals.delivery}</span>
           </div>
           <div className="flex justify-between border-t border-zinc-950 pt-4 mt-4">
             <span className="font-black text-xs uppercase tracking-[0.2em] text-zinc-300">Total Amount</span>
             <span className="font-black text-2xl text-zinc-950 tracking-tightest">৳ {totals.total}</span>
           </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 mt-2">
            <span>Amount Paid</span>
            <span>৳ {totals.paid}</span>
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            <span>Remaining Due</span>
            <span>৳ {totals.due}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 pt-8 border-t border-black/5 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-200">
          Thank you for choosing luxury.
        </p>
        <p className="text-[7px] font-black uppercase tracking-widest text-zinc-200 mt-2">
          This is a computer-generated invoice. No signature required.
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
