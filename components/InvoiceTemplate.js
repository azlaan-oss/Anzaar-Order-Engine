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
      style={{ minHeight: '1131px' }}
    >
      {/* Brand Header - BLACK LOGO & SIMPLE STYLE */}
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
          <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-950">Official Invoice</p>
          <div className="h-0.5 w-16 bg-zinc-200 mx-auto" />
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-6 space-y-12">
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-3 ml-1">Clientele</p>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Reference</p>
                  <p className="text-2xl font-black text-zinc-950">#{order.orderId}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Issue Date</p>
                  <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">{date}</p>
               </div>
            </div>
            <div className="px-6 py-2 bg-zinc-950 rounded-xl">
               <p className="text-[10px] font-black uppercase tracking-widest text-white">Confirmed Order</p>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div>
          <table className="w-full">
            <thead>
              <tr className="text-[11px] font-black uppercase tracking-widest text-zinc-300 text-left border-b-2 border-zinc-50 pb-6">
                <th className="pb-6 pl-4">Description</th>
                <th className="pb-6 text-center">Qty</th>
                <th className="pb-6 text-right pr-4 text-zinc-950">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-8 pl-4 max-w-[400px]">
                    <p className="text-lg font-black text-zinc-950 uppercase tracking-tight mb-2">{item.name}</p>
                    <div className="flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full border border-zinc-900 bg-zinc-950" />
                       <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                         {item.color} • {item.size} • SKU: {item.sku}
                       </p>
                    </div>
                  </td>
                  <td className="py-8 text-center text-base font-black text-zinc-950">{item.quantity}</td>
                  <td className="py-8 text-right pr-4">
                    <p className="text-lg font-black text-zinc-950">৳{item.price.toLocaleString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-between items-end pt-8">
           <div className="max-w-[350px]">
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                 <p className="text-[12px] font-black text-zinc-900 uppercase tracking-widest mb-2">Order Notice</p>
                 <p className="text-[11px] font-bold text-emerald-600 leading-relaxed">
                   আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। আমাদের লাক্সারি কালেকশন বেছে নেওয়ার জন্য ধন্যবাদ।
                 </p>
              </div>
           </div>

           <div className="w-72 space-y-4">
              <div className="space-y-3 px-2">
                 <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Gross Total</span>
                    <span className="text-sm font-black italic">৳{totals.subtotal.toLocaleString()}</span>
                 </div>
                 {totals.discount > 0 && (
                   <div className="flex justify-between items-center text-rose-500">
                      <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                      <span className="text-sm font-black">- ৳{totals.discount.toLocaleString()}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center text-zinc-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
                    <span className="text-sm font-black italic">+ ৳{totals.delivery.toLocaleString()}</span>
                 </div>
              </div>
              <div className="bg-zinc-950 p-6 rounded-3xl text-white text-center">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Grand Total</p>
                 <p className="text-3xl font-black">৳{totals.total.toLocaleString()}</p>
              </div>
              <div className="flex justify-between gap-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">
                 <div className="flex-1 bg-zinc-50 py-2 rounded-xl">Paid: ৳{totals.paid}</div>
                 <div className="flex-1 bg-zinc-50 py-2 rounded-xl">Due: ৳{totals.due}</div>
              </div>
           </div>
        </div>

        {/* SMART CUSTOMER NOTES SECTION */}
        <div className="mt-10 border-t-2 border-zinc-100 pt-10">
           <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              {/* Essential Guidelines */}
              <div className="space-y-4">
                 <h3 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-950 pb-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-zinc-950 text-white flex items-center justify-center rounded-sm text-[8px]">✓</span> 
                    ম্যান্ডেটরি নোটঃ
                 </h3>
                 <ul className="space-y-3 text-[10px] text-zinc-600 font-bold leading-relaxed pr-2">
                    <li className="flex gap-2">
                       <span className="text-zinc-950">১.</span>
                       <span>ক্যামেরা র্যাজুলেশন এবং লাইটিং ডিফারেন্সের কারণে ফেব্রিক কালার কিছুটা ভিন্ন দেখাতে পারে।</span>
                    </li>
                    <li className="flex gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                       <span className="text-emerald-700 font-black">২.</span>
                       <span className="text-emerald-700 font-black italic">অনুগ্রহ করে প্রোডাক্ট আনপ্যাকিং ভিডিও অবশ্যই করে নিবেন।</span>
                    </li>
                    <li className="flex gap-2">
                       <span className="text-zinc-950">৩.</span>
                       <span>প্রোডাক্ট রিজেক্ট বা মিসিং হলে, আনপ্যাকিং ভিডিও পাঠালে আমরা ভ্যারিফাই করে নিউ প্রডাক্ট পাঠিয়ে দিবো ইনশাআল্লাহ।</span>
                    </li>
                    <li className="flex gap-2 text-rose-600">
                       <span className="font-black">৪.</span>
                       <span className="italic">আনপ্যাকিং ভিডিও দিতে না পারলে, প্রডাক্ট রিজেক্ট বা মিসিং ক্লেইম গ্রহনযোগ্য হবে না।</span>
                    </li>
                 </ul>
              </div>

              {/* Exchange Policies */}
              <div className="space-y-4">
                 <h3 className="text-[12px] font-black uppercase tracking-widest text-zinc-950 border-b border-zinc-950 pb-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-zinc-950 text-white flex items-center justify-center rounded-sm text-[8px]">⇄</span>
                    এক্সচেঞ্জ পলিসিঃ
                 </h3>
                 <ul className="space-y-3 text-[10px] text-zinc-600 font-bold leading-relaxed">
                    <li className="flex gap-2">
                       <span className="text-zinc-950">১.</span>
                       <span>এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি চার্জ পে করে সাথে সাথে প্রোডাক্ট রিটার্ন করতে হবে।</span>
                    </li>
                    <li className="flex gap-2">
                       <span className="text-zinc-950">২.</span>
                       <span>অনলাইন এক্সচেঞ্জের ক্ষেত্রে সাথে সাথে আমাদের জানান এবং সর্বোচ্চ ৩ দিনের মধ্যে কনফার্ম করুন।</span>
                    </li>
                    <li className="flex gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100 italic">
                       <span className="text-zinc-900 font-black">৩.</span>
                       <span>কাস্টমাইজ ও ব্যবহারকৃত প্রোডাক্টের ক্ষেত্রে এক্সচেঞ্জ প্রযোজ্য নয়।</span>
                    </li>
                    <li className="flex gap-2">
                       <span className="text-zinc-950">৪.</span>
                       <span>অনলাইনে এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি চার্জ এবং রিটার্ন চার্জ গ্রাহককে বহন করতে হবে।</span>
                    </li>
                 </ul>
              </div>
           </div>
           
           <div className="mt-8 text-center border-t border-zinc-100 pt-6 opacity-30">
              <p className="text-[7px] font-black uppercase tracking-[1em] text-zinc-400">
                Electronic Document Protocol • Anzaar Official Management
              </p>
           </div>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
