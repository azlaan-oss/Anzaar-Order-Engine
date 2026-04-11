import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) setSettings(snap.data());
      } catch (err) {
        console.error("Logo Sync Error:", err);
      }
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
      className="w-[800px] bg-white p-14 md:p-16 text-zinc-950 font-sans relative overflow-hidden flex flex-col"
      style={{ minHeight: '1131px' }} // A4/Standard Ratio
    >
      {/* Dynamic Background Element */}
      <div className="absolute top-[-5%] left-0 right-0 h-40 bg-zinc-50 border-b border-zinc-100 flex items-center justify-center -z-10" />
      
      {/* Brand Header - FIXED LOGO & DYNAMIC STYLE */}
      <div className="flex flex-col items-center text-center mt-4 mb-20">
        {settings?.logoUrl ? (
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-zinc-900/5 blur-3xl rounded-full opacity-50" />
            <img 
              src={settings.logoUrl} 
              className="h-28 w-auto object-contain relative z-10" 
              alt="Brand Logo" 
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <h1 className="text-4xl font-black uppercase tracking-[0.4em] text-zinc-950 mb-4">{settings?.brandName || 'ANZAAR'}</h1>
        )}
        <div className="space-y-2">
          <p className="text-[12px] font-black uppercase tracking-[0.6em] text-zinc-400">Official Statement</p>
          <div className="h-1 w-20 bg-zinc-950 mx-auto rounded-full" />
        </div>
      </div>

      {/* Main Container */}
      <div className="px-6 flex-1 flex flex-col justify-between">
        <div className="space-y-16">
          {/* Info Blocks - Increased Font for Mobile */}
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-3 ml-1">Clientele</p>
                <h2 className="text-3xl font-black text-zinc-950 tracking-tight leading-tight">{customer.name}</h2>
                <p className="text-lg font-bold text-zinc-600 mt-2">{customer.phone}</p>
              </div>
              <div className="pt-2 border-l-4 border-zinc-950 pl-6">
                <p className="text-sm text-zinc-400 leading-relaxed font-bold uppercase tracking-widest">{customer.address}</p>
              </div>
            </div>

            <div className="text-right flex flex-col justify-between items-end">
              <div className="space-y-4">
                 <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300">Reference</p>
                    <p className="text-2xl font-black text-zinc-950">#{order.orderId}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300">Timestamp</p>
                    <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">{date}</p>
                 </div>
              </div>
              <div className="px-8 py-3 bg-zinc-950 rounded-2xl shadow-xl shadow-zinc-950/20">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white">Status: {order.status}</p>
              </div>
            </div>
          </div>

          {/* Itemized Table - High Clarity */}
          <div className="pt-4">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] font-black uppercase tracking-widest text-zinc-300 text-left border-b-2 border-zinc-50 pb-6">
                  <th className="pb-6 pl-4">Manifest</th>
                  <th className="pb-6 text-center">Unit</th>
                  <th className="pb-6 text-right pr-4 text-zinc-950">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-10 pl-4 max-w-[400px]">
                      <p className="text-xl font-black text-zinc-950 uppercase tracking-tight mb-2">{item.name}</p>
                      <div className="flex items-center gap-3">
                         <span className="w-3 h-3 rounded-full border-2 border-zinc-900 bg-zinc-950" />
                         <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest">
                           {item.color} • {item.size} • SKU: {item.sku}
                         </p>
                      </div>
                    </td>
                    <td className="py-10 text-center text-lg font-black text-zinc-950">{item.quantity}</td>
                    <td className="py-10 text-right pr-4">
                      <p className="text-xl font-black text-zinc-950">৳{item.price.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest mt-1">Net Subtotal</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Statement & Totals */}
        <div className="mt-20 pt-16 border-t-2 border-zinc-50 flex justify-between items-end pb-12">
           <div className="max-w-[320px] space-y-6">
              <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase tracking-widest">
                This verification certifies that your order has been successfully logged within our luxury management protocol.
              </p>
              <div className="flex items-center gap-4 opacity-40">
                 <div className="w-16 h-16 border-2 border-dashed border-zinc-200 rounded-3xl flex items-center justify-center p-2">
                    <div className="w-full h-full bg-zinc-50 rounded-xl" />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-950 leading-loose">
                   Digital Signature<br/>Authorized Protocol
                 </p>
              </div>
           </div>

           <div className="w-80">
              <div className="bg-zinc-950 p-10 rounded-[3rem] space-y-6 shadow-2xl shadow-zinc-950/30 text-white relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-3xl text-white" />
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center opacity-40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Gross Total</span>
                      <span className="text-sm font-black italic">৳{totals.subtotal.toLocaleString()}</span>
                   </div>
                   
                   {totals.discount > 0 && (
                     <div className="flex justify-between items-center text-emerald-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Incentive</span>
                        <span className="text-sm font-black">- ৳{totals.discount.toLocaleString()}</span>
                     </div>
                   )}

                   <div className="flex justify-between items-center opacity-40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Logistics</span>
                      <span className="text-sm font-black italic">+ ৳{totals.delivery.toLocaleString()}</span>
                   </div>
                </div>

                <div className="h-[2px] bg-white/10" />

                <div className="flex flex-col gap-1 p-2">
                   <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Grand Valuation</span>
                   <span className="text-4xl font-black tracking-tighter">৳{totals.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                 <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 text-center">
                    <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1 leading-none">Settled</p>
                    <p className="text-lg font-black text-emerald-600 tracking-tight leading-none">৳{totals.paid.toLocaleString()}</p>
                 </div>
                 <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 text-center">
                    <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1 leading-none">Remaining</p>
                    <p className="text-lg font-black text-rose-600 tracking-tight leading-none">৳{totals.due.toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Persistent Footer */}
      <div className="absolute bottom-10 left-0 right-0 text-center opacity-20 mt-12">
        <div className="inline-flex items-center gap-4 px-6 py-2 border border-zinc-200 rounded-full">
           <p className="text-[8px] font-black uppercase tracking-[1em] text-zinc-950 pl-2">
             Anzaar Luxury Management System
           </p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
