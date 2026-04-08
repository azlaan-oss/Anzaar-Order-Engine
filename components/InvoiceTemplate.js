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
      className="w-[800px] bg-white p-12 text-emerald-950 font-sans"
      style={{ minHeight: '1000px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-emerald-900/10 pb-8">
        <div className="flex items-center gap-6">
           {settings?.logoUrl && (
              <div className="w-24 h-24 bg-white rounded-2xl p-2 overflow-hidden flex items-center justify-center border border-emerald-900/10 shadow-sm">
                 <img src={settings.logoUrl} className="max-w-full max-h-full object-contain" alt="Brand Logo" />
              </div>
           )}
           <div>
              <h1 className="text-4xl font-serif font-bold tracking-tight uppercase leading-none">{settings?.brandName || 'anzaar'}</h1>
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-emerald-900/60 mt-1">Order Invoice</p>
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/40 mb-2">Customer Details</p>
          <h2 className="text-xl font-bold">{customer.name}</h2>
          <p className="text-sm mt-1">{customer.phone}</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{customer.address}</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/40 mb-2">Order Summary</p>
           <p className="text-sm font-bold">Status: <span className="text-emerald-600">PAID (ADV)</span></p>
            {order.payment.advancePaid && (
              <div className="mt-2 flex items-center justify-end gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold">Transaction ID</p>
                  <p className="text-xs font-bold">{order.payment.transactionId}</p>
                </div>
                {order.payment.proofUrl && (
                  <img src={order.payment.proofUrl} className="w-12 h-12 rounded-lg border border-emerald-950/10 object-cover" />
                )}
              </div>
            )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full mt-12">
        <thead>
          <tr className="border-b border-emerald-900/10 text-[10px] font-bold uppercase tracking-widest text-left">
            <th className="py-4">Item Description</th>
            <th className="py-4 text-center">Qty</th>
            <th className="py-4 text-right">Price</th>
            <th className="py-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-900/5">
          {items.map((item, idx) => (
            <tr key={idx} className="text-sm">
              <td className="py-6">
                <p className="font-bold">{item.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.color} • SKU: {item.sku}</p>
              </td>
              <td className="py-6 text-center">{item.quantity}</td>
              <td className="py-6 text-right">৳ {item.price}</td>
              <td className="py-6 text-right font-bold text-emerald-900">৳ {item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-12 flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-bold">৳ {totals.subtotal}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Discount</span>
              <span>- ৳ {totals.discount}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Delivery Fee</span>
            <span>+ ৳ {totals.delivery}</span>
          </div>
          <div className="flex justify-between border-t-2 border-emerald-950 pt-4 mt-4">
            <span className="font-serif font-bold text-lg">Total Amount</span>
            <span className="font-serif font-bold text-xl text-emerald-900">৳ {totals.total}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
            <span>Amount Paid</span>
            <span>৳ {totals.paid}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-red-600 bg-red-50 p-2 rounded-lg">
            <span>Remaining Due</span>
            <span>৳ {totals.due}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 pt-8 border-t border-emerald-900/10 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-950/30">
          Thank you for choosing luxury.
        </p>
        <p className="text-[8px] text-gray-300 mt-2 italic">
          This is a computer-generated invoice. No signature required.
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
