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
      style={{ minHeight: '1250px' }} // Increased height for longer notes
    >
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mt-4 mb-14">
        {settings?.logoUrl ? (
          <div className="mb-6">
            <img 
              src={settings.logoUrl} 
              className="h-24 w-auto object-contain brightness-0" 
              alt="Brand Logo" 
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <h1 className="text-4xl font-black uppercase tracking-[0.4em] text-zinc-950 mb-4">{settings?.brandName || 'ANZAAR'}</h1>
        )}
        <div className="space-y-2">
          <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-950">Official Order Invoice</p>
          <div className="h-0.5 w-16 bg-zinc-200 mx-auto" />
        </div>
      </div>

      {/* Customer & Order Information */}
      <div className="px-6 space-y-12">
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-3 ml-1">Client Profile</p>
              <h2 className="text-3xl font-black text-zinc-950 tracking-tight leading-tight">{customer.name}</h2>
              <p className="text-xl font-bold text-zinc-600 mt-2">{customer.phone}</p>
            </div>
            <div className="pt-2 border-l-4 border-zinc-950 pl-6">
              <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest leading-loose">{customer.address}</p>
            </div>
          </div>

          <div className="text-right flex flex-col justify-between items-end text-zinc-950">
            <div className="space-y-5">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Invoice ID</p>
                  <p className="text-2xl font-black">#{order.orderId}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Billing Date</p>
                  <p className="text-sm font-black uppercase tracking-widest">{date}</p>
               </div>
            </div>
            <div className="px-6 py-2 border-2 border-zinc-950 rounded-xl">
               <p className="text-[10px] font-black uppercase tracking-widest">Order Confirmed</p>
            </div>
          </div>
        </div>

        {/* Product Breakdown Table */}
        <div className="pt-4">
          <table className="w-full">
            <thead>
              <tr className="text-[11px] font-black uppercase tracking-widest text-zinc-300 text-left border-b-2 border-zinc-50 pb-6">
                <th className="pb-6 pl-4">Item Details</th>
                <th className="pb-6 text-center">Qty</th>
                <th className="pb-6 text-right pr-4 text-zinc-950">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-8 pl-4 max-w-[400px]">
                    <p className="text-xl font-black text-zinc-950 uppercase tracking-tight mb-2">{item.name}</p>
                    <div className="flex items-center gap-3">
                       <span className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
                       <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest">
                         {item.color} • {item.size} • SKU: {item.sku}
                       </p>
                    </div>
                  </td>
                  <td className="py-8 text-center text-lg font-black text-zinc-950">{item.quantity}</td>
                  <td className="py-8 text-right pr-4">
                    <p className="text-xl font-black mb-1">৳{item.price.toLocaleString()}</p>
                    <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest">Net Value</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Remaining Due Section */}
        <div className="flex justify-between items-start pt-10 border-t-2 border-zinc-50">
           <div className="max-w-[340px] pt-4">
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-emerald-200 shadow-sm shrink-0">
                    <span className="text-emerald-500 font-black">✓</span>
                 </div>
                 <p className="text-[13px] font-bold text-emerald-800 leading-relaxed italic">
                   আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। আঞ্জারের এক্সক্লুসিভ কালেকশন বেছে নেওয়ার জন্য অসংখ্য ধন্যবাদ।
                 </p>
              </div>
           </div>

           <div className="w-[380px] space-y-4">
              <div className="bg-zinc-950 p-8 rounded-[3rem] text-white shadow-2xl shadow-zinc-950/20 relative overflow-hidden">
                 <div className="relative z-10 grid grid-cols-2 gap-8 items-center">
                    <div className="space-y-4 border-r border-white/10 pr-6">
                       <div className="flex justify-between items-center opacity-40">
                          <span className="text-[10px] font-black uppercase tracking-widest">Gross Total</span>
                          <span className="text-xs font-black">৳{totals.subtotal.toLocaleString()}</span>
                       </div>
                       {totals.discount > 0 && (
                        <div className="flex justify-between items-center text-rose-400">
                           <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                           <span className="text-xs font-black">-৳{totals.discount}</span>
                        </div>
                       )}
                       <div className="flex justify-between items-center opacity-40">
                          <span className="text-[10px] font-black uppercase tracking-widest">Logistics</span>
                          <span className="text-xs font-black">+৳{totals.delivery}</span>
                       </div>
                       <div className="pt-4 border-t border-white/5">
                          <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Statement Total</p>
                          <p className="text-xl font-black">৳{totals.total.toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="pl-2 space-y-2 text-center">
                       <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Remaining Due</p>
                       <p className="text-5xl font-black tracking-tighter text-white drop-shadow-lg">৳{totals.due.toLocaleString()}</p>
                       <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full mt-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Payable at Delivery</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex justify-end pr-8">
                 <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                   Already Settled: <span className="text-zinc-950">৳{totals.paid.toLocaleString()}</span>
                 </p>
              </div>
           </div>
        </div>

        {/* HIGH-VISIBILITY GUIDELINES SECTION */}
        <div className="mt-14 pb-12">
           <div className="flex items-center gap-6 mb-10 text-zinc-950">
              <div className="h-[2px] bg-zinc-100 flex-1" />
              <h3 className="text-[16px] font-black uppercase tracking-[0.4em] whitespace-nowrap">অর্ডার গাইডলাইন ও পলিসি</h3>
              <div className="h-[2px] bg-zinc-100 flex-1" />
           </div>

           <div className="grid grid-cols-2 gap-x-14 gap-y-12">
              {/* Mandatory Section */}
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-950 text-white rounded-lg">
                    <span className="text-[13px] font-black uppercase tracking-widest">জরুরি নোট :</span>
                 </div>
                 <ul className="space-y-5">
                    <li className="flex gap-4">
                       <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-black shrink-0">১</div>
                       <p className="text-[13px] font-bold text-zinc-700 leading-relaxed">ক্যামেরা রেজোলিউশন ও আলোর পার্থক্যে ফেব্রিক কাল সামান্য তারতম্য হতে পারে।</p>
                    </li>
                    <li className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                       <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg shadow-emerald-600/20">২</div>
                       <p className="text-[13px] font-black text-emerald-900 leading-relaxed italic">আপনার পার্সেলটি পাওয়ার পর খোলার সময় দয়া করে একটি "আনপ্যাকিং ভিডিও" অবশ্যই করে নিবেন।</p>
                    </li>
                    <li className="flex gap-4">
                       <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-black shrink-0">৩</div>
                       <p className="text-[13px] font-bold text-zinc-700 leading-relaxed">প্রোডাক্টে কোনো ভুল বা ত্রুটি থাকলে আনপ্যাকিং ভিডিও পাঠালে আমরা তাৎক্ষণিক নতুন প্রোডাক্ট পাঠিয়ে দিবো ইনশাআল্লাহ।</p>
                    </li>
                    <li className="flex gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                       <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0">৪</div>
                       <p className="text-[13px] font-black text-rose-900 leading-relaxed">ভিডিও ছাড়া ক্লেইম গ্রহণযোগ্য হবে না। ত্রুটি থাকলে ডেলিভারি ম্যানের কাছেই রিটার্ন করুন এবং আমাদের ইনবক্স করুন।</p>
                    </li>
                 </ul>
              </div>

              {/* Exchange Policy Section */}
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg">
                    <span className="text-[13px] font-black uppercase tracking-widest text-zinc-950">এক্সচেঞ্জ পলিসি :</span>
                 </div>
                 <ul className="space-y-5">
                    <li className="flex gap-4">
                       <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-black shrink-0">১</div>
                       <p className="text-[13px] font-bold text-zinc-700 leading-relaxed">সাইজ বা কালার এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি ম্যান থাকাকালীন ডেলিভারি চার্জ পরিশোধ করে সাথে সাথে প্রোডাক্ট রিটার্ন করুন।</p>
                    </li>
                    <li className="flex gap-4">
                       <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-black shrink-0">২</div>
                       <p className="text-[13px] font-bold text-zinc-700 leading-relaxed">প্রোডাক্ট রিসিভের পর এক্সচেঞ্জ করতে চাইলে সর্বোচ্চ ৩ দিনের মধ্যে আমাদের নিশ্চিত করুন।</p>
                    </li>
                    <li className="flex gap-4 p-4 bg-zinc-950/5 rounded-2xl border border-dashed border-zinc-950/10">
                       <div className="w-6 h-6 rounded-full bg-zinc-950 text-white flex items-center justify-center text-xs font-black shrink-0">৩</div>
                       <p className="text-[13px] font-black text-zinc-900 leading-relaxed">কাস্টমাইজ সাইজ, ডিসকাউন্ট প্রোডাক্ট এবং ব্যবহারকৃত প্রোডাক্টের ক্ষেত্রে এক্সচেঞ্জ বা ক্যান্সেল প্রযোজ্য নয়।</p>
                    </li>
                    <li className="flex gap-4">
                       <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-xs font-black shrink-0">৪</div>
                       <p className="text-[13px] font-bold text-zinc-700 leading-relaxed">অনলাইনে এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি এবং রিটার্ন চার্জ গ্রাহককে বহন করতে হবে। এক্সচেঞ্জ একবারই করা যাবে।</p>
                    </li>
                 </ul>
              </div>
           </div>

           <div className="mt-16 text-center border-t border-zinc-100 pt-8 opacity-40 italic">
              <p className="text-[9px] font-black uppercase tracking-[1em] text-zinc-400">
                Official Document Authorized • {settings?.brandName || 'Anzaar'} Luxury Management
              </p>
           </div>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
