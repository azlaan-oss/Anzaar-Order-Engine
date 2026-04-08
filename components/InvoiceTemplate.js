import React from 'react';

const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
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
      className="w-[450px] bg-white p-8 text-emerald-950 font-sans"
      style={{ minHeight: '800px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-emerald-900/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-black tracking-tighter text-emerald-950">anzaar</h1>
          <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-emerald-900/40 mt-1">Order Architecture</p>
        </div>
        <div className="text-right">
           <div className="bg-emerald-950 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-1">
              Invoice
           </div>
           <p className="text-[10px] font-bold text-emerald-900/40">{date}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mt-8 space-y-4">
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/30 mb-2">Recipient Information</p>
          <h2 className="text-lg font-black text-emerald-950">{customer.name}</h2>
          <p className="text-xs font-bold text-emerald-800 mt-1">{customer.phone}</p>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">{customer.address}</p>
        </div>
        
        <div className="flex justify-between items-center px-2">
           <div>
              <p className="text-[9px] font-bold uppercase text-gray-400">Transaction Proof</p>
              <p className="text-xs font-black text-emerald-900">
                {order.payment.advancePaid ? `Trx: ${order.payment.transactionId}` : 'CASH ON DELIVERY'}
              </p>
           </div>
           <div className="text-right">
              <p className="text-[9px] font-bold uppercase text-gray-400">Order ID</p>
              <p className="text-xs font-black text-emerald-950">#{order.orderId}</p>
           </div>
        </div>
      </div>

      {/* Compact Product Grid */}
      <div className="mt-8 space-y-3">
         <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/30 pl-1">Items Secured</p>
         <div className="divide-y divide-emerald-900/5 border-t border-b border-emerald-900/5">
            {items.map((item, idx) => (
              <div key={idx} className="py-4 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <img src={item.image} className="w-14 h-14 rounded-xl object-cover ring-1 ring-emerald-900/5" />
                       <span className="absolute -top-2 -right-2 bg-emerald-950 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                         {item.quantity}
                       </span>
                    </div>
                    <div>
                       <p className="text-sm font-black text-emerald-950 leading-tight">{item.name}</p>
                       <p className="text-[9px] text-emerald-900/60 font-bold uppercase tracking-tight mt-0.5">
                         {item.color} • {item.size}
                       </p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-emerald-900">৳ {item.price}</p>
                    {item.extraCharge > 0 && <p className="text-[8px] font-bold text-amber-600 tracking-tighter">+ Surcharge Included</p>}
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* Compact Total Ledger */}
      <div className="mt-8 bg-gray-50/50 p-6 rounded-3xl space-y-3 border border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Market Subtotal</span>
            <span className="text-emerald-950">৳ {totals.subtotal}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-xs font-bold text-red-500">
              <span>Campaign Reward</span>
              <span>- ৳ {totals.discount}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold text-gray-400 pb-3 border-b border-gray-200">
            <span>Logistics Fee</span>
            <span className="text-emerald-950">+ ৳ {totals.delivery}</span>
          </div>
          
          <div className="flex justify-between pt-1">
            <span className="font-serif font-black text-xl text-emerald-950">Grand Total</span>
            <span className="font-serif font-black text-2xl text-emerald-900">৳ {totals.total}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
             <div className="bg-emerald-100/50 p-3 rounded-2xl border border-emerald-200/50">
                <p className="text-[8px] font-bold uppercase text-emerald-600 mb-1">Paid Amount</p>
                <p className="text-sm font-black text-emerald-700">৳ {totals.paid}</p>
             </div>
             <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                <p className="text-[8px] font-bold uppercase text-red-400 mb-1">Due Balance</p>
                <p className="text-sm font-black text-red-600">৳ {totals.due}</p>
             </div>
          </div>
      </div>

      {/* Premium Footer with QR */}
      <div className="mt-12 pt-8 border-t-2 border-emerald-900/5 flex justify-between items-end">
        <div className="space-y-4 flex-1 pr-6">
           <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Tracking Capability</p>
             <p className="text-[9px] font-medium text-emerald-800 leading-relaxed italic pr-4">
               "Scan the premium QR code with your mobile device to track order status and estimated arrival."
             </p>
           </div>
           
           <div className="pt-4 flex items-center gap-4 text-[7px] font-black uppercase text-emerald-900/20 tracking-[0.2em]">
              <span>anzaar • premium abaya collection</span>
              <div className="w-1 h-1 rounded-full bg-emerald-100" />
              <span>luxury certified</span>
           </div>
        </div>

        <div className="flex flex-col items-center gap-2">
           <div className="p-3 bg-white border border-emerald-900/10 rounded-3xl shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${typeof window !== 'undefined' ? window.location.origin : ''}/track/${order.id}`} 
                alt="Scan to track"
                className="w-20 h-20"
              />
           </div>
           <p className="text-[8px] font-black text-emerald-950 uppercase tracking-widest">Scan to Track</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
