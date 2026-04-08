"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  RefreshCw,
  Search,
  X,
  AlertCircle,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  History as HistoryIcon,
  Award,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function OrderForm({ onSuccess }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsProductListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State
  const [order, setOrder] = useState({
    customer: { name: '', phone: '', address: '', notes: '' },
    isUrgent: false,
    urgentDate: '',
    items: [],
    delivery: { type: 'inside', charge: 80 },
    discount: { campaign: 'None', percentage: 0 },
    payment: { advancePaid: false, method: 'Bkash', transactionId: '', senderPhone: '', amount: 0, proofUrl: '' }
  });

  const [settings, setSettings] = useState(null);
  const [stagedItems, setStagedItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [customerIntel, setCustomerIntel] = useState({ 
    orders: [], 
    totalSpent: 0, 
    reputation: 'New', 
    successful: 0, 
    pending: 0,
    returns: 0 
  });

  // Customer Intelligence Fetcher
  useEffect(() => {
    if (order.customer.phone.length === 11) {
       const fetchHistory = async () => {
         try {
           const { collection, query, where, getDocs } = await import('firebase/firestore');
           const q = query(collection(db, "orders"), where("customer.phone", "==", order.customer.phone));
           const snap = await getDocs(q);
           
           let spent = 0;
           let successCount = 0;
           let returnCount = 0;
           let pendingCount = 0;
           const historicalOrders = [];

           snap.forEach(doc => {
             const data = doc.data();
             spent += data.totals?.total || 0;
             if (data.status === 'Delivered' || data.status === 'Completed') successCount++;
             else if (data.status === 'Cancelled' || data.status === 'Returned' || data.status === 'Fake') returnCount++;
             else pendingCount++;
             historicalOrders.push(data);
           });

           let rep = 'New';
           if (successCount >= 3) rep = 'Premium';
           else if (successCount >= 1) rep = 'Trusted';
           if (returnCount > 0 && returnCount >= successCount) rep = 'Caution';

           setCustomerIntel({
             orders: historicalOrders,
             totalSpent: spent,
             reputation: rep,
             successful: successCount,
             pending: pendingCount,
             returns: returnCount
           });

           if (historicalOrders.length > 0) {
              const latest = historicalOrders.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
              setOrder(prev => ({ ...prev, customer: { ...prev.customer, name: latest.customer.name, address: latest.customer.address } }));
           }
         } catch (e) { console.error("Intel fetch failed:", e); }
       };
       fetchHistory();
    } else {
      // Clear auto-fills if phone is changed/incomplete
      setCustomerIntel({ orders: [], totalSpent: 0, reputation: 'New', successful: 0, pending: 0, returns: 0 });
      setOrder(prev => ({ ...prev, customer: { ...prev.customer, name: '', address: '' } }));
    }
  }, [order.customer.phone]);

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

  const addItemToStage = () => {
    if (!selectedProduct || !selectedVariant) return toast.error("Select product and color first");
    if (!selectedSize) return toast.error("Select a size first");

    let extraCharge = 0;
    let sizeText = selectedSize;

    if (selectedSize === 'Customize') {
       const long = parseInt(customMeasures.long) || 0;
       const body = parseInt(customMeasures.body) || 0;
       const sleeve = parseInt(customMeasures.sleeve) || 0;
       const shoulder = parseInt(customMeasures.shoulder) || 0;

       if (body > 58) return toast.error("Body max limit 58");
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
      price: selectedProduct.basePrice + extraCharge,
      extraCharge: extraCharge,
      image: selectedVariant.imageUrl,
      quantity: 1,
      sku: selectedVariant.sku,
      id: Date.now()
    };
    
    setStagedItems([...stagedItems, newItem]);
    
    // Reset Selection After Staging
    setSelectedVariantId('');
    setSelectedSize('');
    setCustomMeasures({ long: '', body: '', sleeve: '', shoulder: '' });
  };

  const confirmStagedToOrder = () => {
    if (stagedItems.length === 0) return;
    setOrder({ ...order, items: [...order.items, ...stagedItems] });
    setStagedItems([]);
    toast.success(`${stagedItems.length} products added to order architecture!`);
  };

  const removeItem = (id, isStage = false) => {
    if (isStage) {
      setStagedItems(stagedItems.filter(i => i.id !== id));
    } else {
      setOrder({ ...order, items: order.items.filter(i => i.id !== id) });
    }
  };

  // Image Compressor Utility
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Resize/Compress using Canvas
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400; // Small size for proof
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // 60% quality
          
          // In a real app, upload dataUrl (Base64) to Firebase Storage. 
          // For now, we'll store the small Base64 string directly as proofUrl.
          setOrder(prev => ({ ...prev, payment: { ...prev.payment, proofUrl: dataUrl } }));
          setUploading(false);
          toast.success("Proof uploaded and compressed!");
        };
      };
    } catch (err) {
      toast.error("Image processing failed");
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (order.items.length === 0) return toast.error("Add at least one item");
    if (order.customer.phone.length !== 11) return toast.error("Phone number must be exactly 11 digits");
    if (order.payment.advancePaid && !order.payment.transactionId) return toast.error("Transaction ID required");

    setSubmitting(true);
    const toastId = toast.loading("Processing order...");

    try {
      // 1. Mandatory Advance for Custom Sizes Validation
      const hasCustomSize = order.items.some(item => item.size.includes('Custom'));
      const isSpecialPermission = order.discount.campaign.includes("Special");

      if (hasCustomSize && !order.payment.advancePaid && !isSpecialPermission) {
        setSubmitting(false);
        return toast.error("Advance Payment is mandatory for Customized Sizes!", {
          description: "Use 'Special Permission' discount if you need to bypass this for VIP customers."
        });
      }

      // 2. Generate Sequenced Custom ID
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
        orderId: customOrderId, 
        totals: { subtotal, discount: discountAmount, delivery: order.delivery.charge, total, paid: order.payment.amount, due },
        status: order.discount.campaign.includes("Special") ? 'Pending Approval' : 'Pending',
        approvalStatus: order.discount.campaign.includes("Special") ? 'Awaiting Admin Approval' : 'Auto-Approved',
        timestamp: new Date().toISOString()
      };
      
      const firebaseDocId = await createOrder({ ...orderData, id: customOrderId });

      // 4. Trigger Google Sheets Sync (Backgrounded for speed)
      fetch('/api/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...orderData, 
          orderId: customOrderId,
          sheetId: settings?.activeSheetId,
          sheetTab: settings?.activeSheetTab || 'Sheet1'
        })
      }).then(async res => {
        if (!res.ok) {
           const errData = await res.json();
           toast.warning(`Sheets Sync Pending: ${errData.error}`, { duration: 5000 });
        }
      }).catch(err => console.error("Sheets Background Sync Failed:", err));

       toast.dismiss(toastId);
       toast.success(`Order #${customOrderId} placed successfully!`);
      
      // Reset form or redirect
      setOrder({
        customer: { name: '', phone: '', address: '', notes: '' },
        isUrgent: false,
        urgentDate: '',
        items: [],
        delivery: { ...order.delivery },
        discount: { ...order.discount },
        payment: { advancePaid: false, method: 'Bkash', transactionId: '', amount: 0 }
      });
      if (onSuccess) onSuccess({ ...orderData, orderId: customOrderId, id: firebaseDocId });

      // 5. Log Activity
      await logActivity("Moderator", "Placed New Order", { orderId: customOrderId, customer: order.customer.name, total: orderData.totals.total });
    } catch (error) {
      console.error("Order Creation Failed:", error);
      toast.error("Critical System Error. Order failed to deploy.");
    } finally {
      toast.dismiss(toastId);
      setSubmitting(false);
    }
  };

  return (
    <form 
      autoComplete="off"
      onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} 
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20"
    >
      
      {/* Left Column: Customer & Selection */}
      <div className="space-y-8">
        
        {/* Section: Customer Info */}
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-900">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-gray-900">Customer Intelligence</h3>
              </div>
              
              <AnimatePresence>
                {order.customer.phone.length === 11 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      customerIntel.reputation === 'Premium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      customerIntel.reputation === 'Caution' ? 'bg-red-50 text-red-600 border-red-200' :
                      customerIntel.reputation === 'Trusted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                  >
                     {customerIntel.reputation === 'Premium' && <Award className="w-3 h-3" />}
                     {customerIntel.reputation === 'Caution' && <AlertTriangle className="w-3 h-3" />}
                     {customerIntel.reputation === 'Trusted' && <ShieldCheck className="w-3 h-3" />}
                     {customerIntel.reputation} Profile
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

          {customerIntel.orders.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950 p-4 rounded-2xl flex items-center justify-between text-white"
            >
               <div className="space-y-1">
                  <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Lifetime Pulse</p>
                  <p className="text-sm font-black tracking-tight">৳ {customerIntel.totalSpent.toLocaleString()}</p>
               </div>
               <div className="flex items-center gap-4 text-center border-l border-white/10 pl-4">
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">Orders</p>
                    <p className="text-xs font-bold">{customerIntel.orders.length}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">Success</p>
                    <p className="text-xs font-bold text-emerald-400">{customerIntel.successful}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">Active</p>
                    <p className="text-xs font-bold text-blue-400">{customerIntel.pending}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">Returns</p>
                    <p className="text-xs font-bold text-red-400">{customerIntel.returns}</p>
                  </div>
               </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Name</label>
              <div className="relative">
                <input 
                  type="text" required
                  autoFocus
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
              <div className="relative group">
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

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-2xl border border-red-100/50">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Urgent Priority?</span>
                </div>
                <div 
                  onClick={() => setOrder({...order, isUrgent: !order.isUrgent})}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${order.isUrgent ? 'bg-red-500' : 'bg-gray-200'}`}
                >
                  <motion.div 
                    animate={{ x: order.isUrgent ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </div>
              </div>

              <AnimatePresence>
                {order.isUrgent && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-red-500 tracking-widest pl-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> Delivery Deadline Date
                        </label>
                        <input 
                          type="date"
                          required={order.isUrgent}
                          value={order.urgentDate}
                          onChange={e => setOrder({...order, urgentDate: e.target.value})}
                          className="w-full bg-gray-50 text-emerald-950 font-bold border border-gray-100 p-3 rounded-xl focus:ring-2 focus:ring-red-500/10 focus:outline-none"
                        />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Section: Product Smart Selector */}
        <section className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-gold-50 p-2 rounded-lg text-gold-600">
               <ShoppingBag className="w-5 h-5" />
             </div>
             <h3 className="font-serif font-bold text-lg text-gray-900">Add Products</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative" ref={searchRef}>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-900 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text"
                placeholder="Smart Search Product..."
                value={productSearch || (selectedProduct?.name || '')}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductListOpen(true);
                  if (e.target.value === '') setSelectedProductId('');
                }}
                onFocus={() => setIsProductListOpen(true)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-emerald-900/5 focus:outline-none placeholder:text-gray-300"
              />
              
              <AnimatePresence>
                {isProductListOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar"
                  >
                    {products.filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 italic">No products found</div>
                    ) : (
                      products.filter(p => 
                        p.name.toLowerCase().includes(productSearch.toLowerCase())
                      ).map(p => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setSelectedVariantId('0'); // Auto-select first variant
                            setSelectedSize('52(S)');  // Auto-select first size
                            setProductSearch('');
                            setIsProductListOpen(false);
                          }}
                          className="p-4 hover:bg-emerald-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                           <div>
                             <p className="text-xs font-bold text-emerald-950 uppercase">{p.name}</p>
                             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{p.category || 'Luxury'}</p>
                           </div>
                           <span className="text-[10px] font-black text-emerald-900">৳{p.basePrice}</span>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

             <select 
              value={selectedVariantId}
              disabled={!selectedProductId}
              onChange={e => setSelectedVariantId(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 border border-gray-100 p-3 rounded-xl focus:outline-none disabled:opacity-50"
             >
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
                className="flex items-center gap-4 bg-gray-50/80 p-5 rounded-[2rem] border border-gray-100 shadow-sm"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                   <img src={selectedVariant.imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                   <h4 className="font-serif font-black text-emerald-950 text-base leading-tight">{selectedProduct.name}</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                     {selectedVariant.color} • SKU: {selectedVariant.sku}
                   </p>
                   <p className="text-xl font-black text-emerald-900 mt-1">৳ {selectedProduct.basePrice + (selectedSize === 'Customize' ? 0 : 0)}</p>
                </div>
                <button 
                  type="button"
                  onClick={addItemToStage}
                  className="bg-emerald-900 hover:bg-emerald-950 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                >
                  Stage Product
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staged Items Buffer */}
          <AnimatePresence>
            {stagedItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 space-y-4"
              >
                <div className="flex justify-between items-center text-emerald-900 font-black text-[10px] uppercase tracking-widest">
                  <span>Product Queue ({stagedItems.length})</span>
                  <button type="button" onClick={confirmStagedToOrder} className="bg-emerald-900 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition-colors">
                    Add All to Order
                  </button>
                </div>
                <div className="space-y-2">
                  {stagedItems.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={item.image} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-950">{item.name}</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase">{item.color} • {item.size}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id, true)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                    title="Remove individual product"
                   >
                     <X className="w-3.5 h-3.5" />
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
                  if (e.target.value === 'special') {
                    setOrder({...order, discount: { campaign: 'Special Permission Override', percentage: 0 }});
                  } else {
                    const pct = parseInt(e.target.value);
                    setOrder({...order, discount: { campaign: e.target.options[e.target.selectedIndex].text, percentage: pct }});
                  }
                }}
                className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-sm focus:outline-none"
               >
                 <option value="0">No Campaign</option>
                 {settings?.campaigns.map((camp, idx) => (
                   <option key={idx} value={camp.percentage}>{camp.name} ({camp.percentage}%)</option>
                 ))}
                 <option value="special">Special Permission</option>
               </select>
             </div>
          </div>

           {order.discount.campaign.includes("Special") && (
             <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="mt-4 p-3 bg-gold-400/10 rounded-xl border border-gold-400/20 space-y-2">
                <div className="flex items-center gap-2 text-gold-400">
                   <AlertTriangle className="w-3 h-3" />
                   <div className="text-[9px] font-black uppercase tracking-widest">Auth Required</div>
                </div>
                <input 
                  type="number"
                  placeholder="Manual Discount %"
                  value={order.discount.percentage}
                  onChange={e => setOrder({...order, discount: { ...order.discount, percentage: parseInt(e.target.value) || 0 }})}
                  className="w-full bg-white/10 border border-white/10 p-2 rounded-lg text-xs"
                />
             </motion.div>
           )}

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
                 <input 
                  type="tel" 
                  placeholder="Sender Phone"
                  value={order.payment.senderPhone || ''}
                  onChange={e => setOrder({...order, payment: {...order.payment, senderPhone: e.target.value}})}
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
                 <div className="col-span-full space-y-2">
                    <label className="text-[8px] font-bold text-white/40 uppercase block">Proof Photo (Compressed)</label>
                    <div className="flex items-center gap-3">
                       <label className="flex-1 bg-white/10 border border-white/10 p-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-white/20 transition-all border-dashed">
                          <ExternalLink className="w-3 h-3 text-gold-400" />
                          <span className="text-[10px] font-bold uppercase">Upload Proof</span>
                          <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                       </label>
                       {order.payment.proofUrl && (
                         <div className="relative group">
                            <img src={order.payment.proofUrl} className="w-10 h-10 rounded-lg border border-white/20 object-cover" />
                            <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-emerald-400 bg-emerald-950 rounded-full" />
                         </div>
                       )}
                       {uploading && <RefreshCw className="w-4 h-4 animate-spin text-gold-400" />}
                    </div>
                 </div>
               </motion.div>
             )}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 pt-4">
             <div className="flex justify-between text-white/50 text-xs">
                <span>Subtotal (Base)</span>
                <span>৳ {subtotal - order.items.reduce((a,c) => a+c.extraCharge, 0)}</span>
             </div>
             {order.items.some(i => i.extraCharge > 0) && (
               <div className="flex justify-between text-amber-400 text-xs italic">
                  <span>Size Surcharge / Adjustments</span>
                  <span>+ ৳ {order.items.reduce((a,c) => a+c.extraCharge, 0)}</span>
               </div>
             )}
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
