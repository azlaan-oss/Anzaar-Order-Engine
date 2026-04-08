"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  getProducts, 
  createOrder 
} from '../lib/firebase-utils';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logActivity } from '../lib/logger';
import { 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Truck, 
  Tag, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function OrderForm({ onSuccess }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [order, setOrder] = useState({
    customer: { name: '', phone: '', address: '', notes: '' },
    isUrgent: false,
    items: [],
    delivery: { type: 'inside', charge: 80 },
    discount: { campaign: 'None', percentage: 0 },
    payment: { advancePaid: false, method: 'Bkash', transactionId: '', amount: 0 }
  });

  const [settings, setSettings] = useState(null);

  // Load Products & Settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, settingsSnap] = await Promise.all([
          getProducts(),
          getDoc(doc(db, "settings", "global"))
        ]);
        setProducts(prodData);
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          setSettings(s);
          // Update default delivery charge
          setOrder(prev => ({...prev, delivery: { ...prev.delivery, charge: s.deliveryRates.inside }}));
        }
      } catch (err) {
        toast.error("Failed to load system data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [customMeasures, setCustomMeasures] = useState({ long: '', body: '', sleeve: '', shoulder: '' });

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedProductId), 
  [products, selectedProductId]);

  const selectedVariant = useMemo(() => 
    selectedProduct?.variants.find((_, idx) => idx.toString() === selectedVariantId),
  [selectedProduct, selectedVariantId]);

  // Calculations
  const subtotal = useMemo(() => 
    order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  [order.items]);

  const discountAmount = (subtotal * order.discount.percentage) / 100;
  const total = subtotal - discountAmount + order.delivery.charge;
  const due = total - order.payment.amount;

  const addItem = () => {
    if (!selectedProduct || !selectedVariant) return toast.error("Select product and color first");
    if (!selectedSize) return toast.error("Select a size first");

    let extraCharge = 0;
    let sizeText = selectedSize;

    if (selectedSize === 'Customize') {
       const long = parseInt(customMeasures.long) || 0;
       const body = parseInt(customMeasures.body) || 0;
       const sleeve = parseInt(customMeasures.sleeve) || 0;
       const shoulder = parseInt(customMeasures.shoulder) || 0;

       if (body > 58) {
         return toast.error("বডি সর্বোচ্চ ৫৮ সাইজ পর্যন্ত দেওয়া যাবে (Body max limit 58)");
       }

       if (long > 62) extraCharge += 450;
       else if (long > 58) extraCharge += 250;

       if (body > 48) extraCharge += 250;

       sizeText = `Custom (L:${long}, B:${body}, Sl:${sleeve}, Sh:${shoulder})`;
    }

    const newItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      color: selectedVariant.color,
      size: sizeText,
      price: selectedProduct.basePrice + extraCharge, // Final dynamically calculated price
      extraCharge: extraCharge,
      image: selectedVariant.imageUrl,
      quantity: 1,
      sku: selectedVariant.sku,
      id: Date.now()
    };
    setOrder({ ...order, items: [...order.items, newItem] });
    setSelectedVariantId('');
    setSelectedSize('');
    setCustomMeasures({ long: '', body: '', sleeve: '', shoulder: '' });
  };

  const removeItem = (id) => {
    setOrder({ ...order, items: order.items.filter(i => i.id !== id) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (order.items.length === 0) return toast.error("Add at least one item");
    if (order.payment.advancePaid && !order.payment.transactionId) return toast.error("Transaction ID required");

    setSubmitting(true);
    const toastId = toast.loading("Processing order...");

    try {
      // 1. Generate Sequenced Custom ID
      const prefix = settings?.orderPrefix || 'A0226-';
      const seq = settings?.orderSequence || 1;
      const customOrderId = `${prefix}${String(seq).padStart(2, '0')}`;
      
      // 2. Increment Backend Sequence Immediately
      if (settings) {
        try {
          const { updateSettings } = await import('../lib/firebase-utils');
          await updateSettings({ orderSequence: seq + 1 });
        } catch (e) { console.error("Sequence update skip:", e); }
      }

      // 3. Save to Firebase
      const orderData = {
        ...order,
        orderId: customOrderId, // Inject Custom Order ID
        totals: { subtotal, discount: discountAmount, delivery: order.delivery.charge, total, paid: order.payment.amount, due },
        timestamp: new Date().toISOString()
      };
      
      const firebaseDocId = await createOrder({ ...orderData, id: customOrderId });

      // 4. Trigger Google Sheets Sync
      try {
        const res = await fetch('/api/sync-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...orderData, 
            orderId: customOrderId,
            sheetId: settings?.activeSheetId,
            sheetTab: settings?.activeSheetTab || 'Sheet1'
          })
        });
        
        if (!res.ok) {
           const errData = await res.json();
           console.error("Sheets Error:", errData);
           toast.warning(`Google Sheets Error: ${errData.error}`, { duration: 10000 });
        }
      } catch (syncErr) {
        console.error("Sheets sync failed:", syncErr);
        toast.warning("Order saved, but Sheets sync failed. Please check logs.");
      }

      toast.success(`Order #${customOrderId} placed successfully!`, { id: toastId });
      
      // Reset form or redirect
      setOrder({
        customer: { name: '', phone: '', address: '', notes: '' },
        isUrgent: false,
        items: [],
        delivery: { ...order.delivery },
        discount: { ...order.discount },
        payment: { advancePaid: false, method: 'Bkash', transactionId: '', amount: 0 }
      });
      if (onSuccess) onSuccess({ ...orderData, orderId: customOrderId, id: firebaseDocId });

      // 5. Log Activity
      await logActivity("Moderator", "Placed New Order", { orderId: customOrderId, customer: order.customer.name, total: orderData.totals.total });
    } catch (error) {
      toast.error("Order failed: " + error.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Left Column: Customer & Selection */}
      <div className="space-y-8">
        
        {/* Section: Customer Info */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-emerald-50 p-2 rounded-lg text-emerald-900">
               <User className="w-5 h-5" />
             </div>
             <h3 className="font-serif font-bold text-lg text-gray-900">Customer Intelligence</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Name</label>
              <div className="relative">
                <input 
                  type="text" required
                  value={order.customer.name}
                  onChange={e => setOrder({...order, customer: {...order.customer, name: e.target.value}})}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-emerald-900/5 focus:outline-none pl-10" 
                  placeholder="Enter full name"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Phone</label>
              <div className="relative">
                <input 
                  type="tel" required
                  value={order.customer.phone}
                  onChange={e => setOrder({...order, customer: {...order.customer, phone: e.target.value}})}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-emerald-900/5 focus:outline-none pl-10" 
                  placeholder="01XXXXXXXXX"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Address</label>
            <div className="relative">
              <textarea 
                required
                value={order.customer.address}
                onChange={e => setOrder({...order, customer: {...order.customer, address: e.target.value}})}
                rows="2"
                className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-emerald-900/5 focus:outline-none pl-10" 
                placeholder="Village/Road, House, Area, City"
              />
              <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-300" />
            </div>
            <div className="space-y-1 col-span-full">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Special Notes</label>
              <textarea 
                value={order.customer.notes}
                onChange={e => setOrder({...order, customer: {...order.customer, notes: e.target.value}})}
                rows="1"
                className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-emerald-900/5 focus:outline-none" 
                placeholder="Any special instructions for the rider or packing..."
              />
            </div>
          </div>
        </section>

        {/* Section: Product Smart Selector */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-gold-50 p-2 rounded-lg text-gold-600">
               <ShoppingBag className="w-5 h-5" />
             </div>
             <h3 className="font-serif font-bold text-lg text-gray-900">Add Products</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <select 
              value={selectedProductId}
              onChange={e => { setSelectedProductId(e.target.value); setSelectedVariantId(''); }}
              className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:outline-none"
             >
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>

             <select 
              value={selectedVariantId}
              disabled={!selectedProductId}
              onChange={e => setSelectedVariantId(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:outline-none disabled:opacity-50"
             >
                <option value="">Select Color...</option>
                {selectedProduct?.variants.map((v, idx) => (
                  <option key={idx} value={idx}>{v.color}</option>
                ))}
             </select>

             <select 
              value={selectedSize}
              disabled={!selectedVariantId}
              onChange={e => setSelectedSize(e.target.value)}
              className="w-full md:col-span-2 bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:outline-none disabled:opacity-50"
             >
                <option value="">Select Size...</option>
                <option value="52(S)">52 (S)</option>
                <option value="54(M)">54 (M)</option>
                <option value="56(L)">56 (L)</option>
                <option value="Customize">Customize Size</option>
             </select>
          </div>

          <AnimatePresence>
            {selectedSize === 'Customize' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-4 gap-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100"
              >
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Long</label>
                   <input type="number" placeholder='e.g. 56' value={customMeasures.long} onChange={e => setCustomMeasures({...customMeasures, long: e.target.value})} className="w-full p-2 text-xs rounded-lg border-emerald-200 border focus:outline-none"/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Body</label>
                   <input type="number" placeholder='Max 58' value={customMeasures.body} onChange={e => setCustomMeasures({...customMeasures, body: e.target.value})} className={`w-full p-2 text-xs rounded-lg border ${parseInt(customMeasures.body) > 58 ? 'border-red-400 focus:ring-red-400' : 'border-emerald-200'} focus:outline-none`}/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Sleeve</label>
                   <input type="number" placeholder='e.g. 22' value={customMeasures.sleeve} onChange={e => setCustomMeasures({...customMeasures, sleeve: e.target.value})} className="w-full p-2 text-xs rounded-lg border-emerald-200 border focus:outline-none"/>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-500 uppercase">Shoulder</label>
                   <input type="number" placeholder='e.g. 15' value={customMeasures.shoulder} onChange={e => setCustomMeasures({...customMeasures, shoulder: e.target.value})} className="w-full p-2 text-xs rounded-lg border-emerald-200 border focus:outline-none"/>
                 </div>
                 <div className="col-span-4 text-[10px] text-emerald-700 font-medium">
                   *Long &gt; 58 = +250 ৳ | Long &gt; 62 = +450 ৳ | Body &gt; 48 = +250 ৳ | Body limit: 58
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedVariant && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100"
              >
                <img src={selectedVariant.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                   <h4 className="font-bold text-gray-900">{selectedProduct.name}</h4>
                   <p className="text-xs text-gray-500">{selectedVariant.color} • SKU: {selectedVariant.sku}</p>
                   <p className="font-bold text-emerald-900">৳ {selectedProduct.basePrice}</p>
                </div>
                <button 
                  type="button"
                  onClick={addItem}
                  className="bg-emerald-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                >
                  Add to Cart
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      {/* Right Column: Order Summary & Logic */}
      <div className="space-y-8">
        
        {/* Section: Checkout Summary */}
        <section className="bg-emerald-950 p-8 rounded-[40px] text-white shadow-2xl space-y-6 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <h3 className="font-serif font-bold text-xl flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-gold-400" />
            Order Architecture
          </h3>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {order.items.length === 0 ? (
              <div className="py-10 text-center opacity-30 italic text-sm">No items added yet.</div>
            ) : order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                   <img src={item.image} className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/20" />
                   <div>
                     <p className="text-sm font-bold leading-tight">{item.name}</p>
                     <p className="text-[10px] text-gold-400 font-bold uppercase tracking-widest">{item.color} • {item.size}</p>
                     {item.extraCharge > 0 && <p className="text-[10px] text-emerald-400 font-bold">+ ৳ {item.extraCharge} Size Surcharge</p>}
                   </div>
                </div>
                <div className="text-right flex items-center gap-4">
                   <p className="font-bold text-gold-400">৳ {item.price}</p>
                   <button 
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                   >
                     <ChevronRight className="w-4 h-4 rotate-45" />
                   </button>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-white/10" />

          {/* Logic Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-white/40 uppercase pl-1">Delivery Zone</label>
               <select 
                value={order.delivery.type}
                onChange={e => {
                  const type = e.target.value;
                  const charge = settings?.deliveryRates?.[type] || (type === 'inside' ? 80 : 150);
                  setOrder({...order, delivery: { type, charge }});
                }}
                className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-sm focus:outline-none"
               >
                 <option value="inside">Inside Dhaka (৳{settings?.deliveryRates?.inside || 80})</option>
                 <option value="outside">Outside Dhaka (৳{settings?.deliveryRates?.outside || 150})</option>
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-bold text-white/40 uppercase pl-1">Campaign Discount</label>
               <select 
                value={order.discount.percentage}
                onChange={e => {
                  const pct = parseInt(e.target.value);
                  setOrder({...order, discount: { campaign: e.target.options[e.target.selectedIndex].text, percentage: pct }});
                }}
                className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-sm focus:outline-none"
               >
                 {settings?.campaigns.map((camp, idx) => (
                   <option key={idx} value={camp.percentage}>{camp.name} ({camp.percentage}%)</option>
                 )) || (
                   <>
                    <option value="0">No Campaign</option>
                    <option value="5">Eid Promo (5%)</option>
                   </>
                 )}
               </select>
             </div>
          </div>

          {/* Advance Payment Logic */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gold-400" />
                  <span className="text-sm font-bold">Advance Payment?</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={order.payment.advancePaid}
                  onChange={e => setOrder({...order, payment: {...order.payment, advancePaid: e.target.checked}})}
                  className="w-5 h-5 accent-gold-400"
                />
             </div>

             {order.payment.advancePaid && (
               <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3 pt-2"
               >
                 <select 
                  value={order.payment.method}
                  onChange={e => setOrder({...order, payment: {...order.payment, method: e.target.value}})}
                  className="bg-white/10 border border-white/10 p-2 rounded-lg text-xs"
                 >
                   <option value="Bkash">Bkash</option>
                   <option value="Nagad">Nagad</option>
                   <option value="Bank">Bank</option>
                 </select>
                 <input 
                  type="text" 
                  placeholder="Trx ID"
                  required
                  value={order.payment.transactionId}
                  onChange={e => setOrder({...order, payment: {...order.payment, transactionId: e.target.value}})}
                  className="bg-white/10 border border-white/10 p-2 rounded-lg text-xs placeholder:text-white/30"
                 />
                 <div className="col-span-full">
                    <input 
                      type="number" 
                      placeholder="Advance Amount (৳)"
                      value={order.payment.amount}
                      onChange={e => setOrder({...order, payment: {...order.payment, amount: parseFloat(e.target.value) || 0}})}
                      className="w-full bg-white/10 border border-white/10 p-2 rounded-lg text-xs"
                    />
                 </div>
               </motion.div>
             )}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 pt-4">
             <div className="flex justify-between text-white/50 text-xs">
                <span>Subtotal</span>
                <span>৳ {subtotal}</span>
             </div>
             {discountAmount > 0 && (
               <div className="flex justify-between text-red-400 text-xs">
                  <span>Discount ({order.discount.percentage}%)</span>
                  <span>- ৳ {discountAmount}</span>
               </div>
             )}
             <div className="flex justify-between text-white/50 text-xs">
                <span>Delivery Fee</span>
                <span>+ ৳ {order.delivery.charge}</span>
             </div>
             <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10 mt-2">
                <span>Grand Total</span>
                <span className="text-gold-400">৳ {total}</span>
             </div>
             <div className="flex justify-between text-red-400 text-xs font-bold bg-red-400/10 p-2 rounded-lg">
                <span>Remaining Due</span>
                <span>৳ {due}</span>
             </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-gold-500/20 active:scale-95"
          >
            {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Submit Luxury Order
          </button>
        </section>

      </div>
    </form>
  );
}
