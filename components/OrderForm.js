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
  const [customColorName, setCustomColorName] = useState('');
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
    if (!selectedProduct || !selectedVariantId) return toast.error("Select product and color first");
    if (selectedVariantId === 'custom' && !customColorName) return toast.error("Enter custom color name");
    if (selectedProduct.isStockOut) return toast.error("This product is currently Stock Out");
    if (selectedVariantId !== 'custom' && selectedVariant.isStockOut) return toast.error("This color variation is currently Stock Out");
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
      color: selectedVariantId === 'custom' ? customColorName : selectedVariant.color,
      size: sizeText,
      price: selectedProduct.basePrice + extraCharge,
      extraCharge: extraCharge,
      image: selectedVariantId === 'custom' ? (selectedProduct.variants[0]?.imageUrl || '') : selectedVariant.imageUrl,
      quantity: 1,
      sku: selectedVariantId === 'custom' ? `${selectedProduct.id}-CUSTOM` : selectedVariant.sku,
      id: Date.now()
    };
    
    setStagedItems([...stagedItems, newItem]);
    
    // Reset Selection After Adding
    setSelectedProductId('');
    setSelectedVariantId('');
    setSelectedSize('');
    setCustomColorName('');
    setCustomMeasures({ long: '', body: '', sleeve: '', shoulder: '' });
  };

  const confirmStagedToOrder = () => {
    if (stagedItems.length === 0) return;
    setOrder({ ...order, items: [...order.items, ...stagedItems] });
    setStagedItems([]);
    toast.success(`${stagedItems.length} products added to order!`);
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
      const finalOrderData = { 
          ...orderData, 
          orderId: customOrderId,
          sheetId: settings?.activeSheetId,
          sheetTab: settings?.activeSheetTab || 'Sheet1'
      };

      fetch('/api/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOrderData)
      }).then(async res => {
        const data = await res.json();
        if (!res.ok) {
           toast.warning(`Sync Alert: ${data.error || 'Connection unstable'}`, { 
             description: "The order is saved in the vault, but the Google Sheet update is pending.",
             duration: 6000 
           });
        } else {
           console.log("Protocol Sync Successful:", data.message);
        }
      }).catch(err => {
        console.error("Sheets Background Sync Failed:", err);
        toast.error("Cloud Sync Protocol Interrupted", {
          description: "System will retry in the next cycle."
        });
      });

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
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-32 px-4 md:px-0"
    >
      
      {/* Left Column: Customer & Selection */}
      <div className="space-y-8">
        
        {/* Section: Customer Info */}
        <section className="glass-panel p-6 rounded-[2.5rem] space-y-6">
           <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-zinc-950/5 p-2 rounded-lg text-zinc-950">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-zinc-950 uppercase tracking-tight">Customer Details</h3>
              </div>
              
              <AnimatePresence>
                {order.customer.phone.length === 11 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                      customerIntel.reputation === 'Premium' ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' :
                      customerIntel.reputation === 'Caution' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      customerIntel.reputation === 'Trusted' ? 'bg-zinc-950/10 text-zinc-950 border-black/5' :
                      'bg-black/5 text-zinc-400 border-black/5'
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
              className="bg-white/40 backdrop-blur-3xl p-4 rounded-3xl flex items-center justify-between text-zinc-950 border border-black/5"
            >
               <div className="space-y-1">
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Total Spent</p>
                  <p className="text-sm font-black tracking-tight">৳ {customerIntel.totalSpent.toLocaleString()}</p>
               </div>
               <div className="flex items-center gap-4 text-center border-l border-white/10 pl-4">
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">Orders</p>
                    <p className="text-xs font-bold">{customerIntel.orders.length}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase">Success</p>
                    <p className="text-xs font-bold text-zinc-400">{customerIntel.successful}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] pl-1">Phone Number</label>
              <div className="relative group">
                <input 
                  type="tel" required
                  value={order.customer.phone}
                  onChange={e => setOrder({...order, customer: {...order.customer, phone: e.target.value}})}
                  className="w-full bg-white text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-2 focus:ring-zinc-950/5 focus:outline-none pl-12 font-black placeholder:text-zinc-300" 
                  placeholder="01XXXXXXXXX"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
              </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] pl-1">Customer Name</label>
               <div className="relative">
                 <input 
                   type="text" required
                   value={order.customer.name}
                   onChange={e => setOrder({...order, customer: {...order.customer, name: e.target.value}})}
                   className="w-full bg-white text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-2 focus:ring-zinc-950/5 focus:outline-none pl-12 font-black placeholder:text-zinc-300" 
                   placeholder="FULL NAME"
                 />
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
               </div>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] pl-1">Full Address</label>
            <div className="relative">
              <textarea 
                required
                value={order.customer.address}
                onChange={e => setOrder({...order, customer: {...order.customer, address: e.target.value}})}
                rows="2"
                className="w-full bg-white text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-2 focus:ring-zinc-950/5 focus:outline-none pl-12 font-black placeholder:text-zinc-300" 
                placeholder="Village/Road, Area, City"
              />
              <MapPin className="absolute left-4 top-5 w-4 h-4 text-zinc-300" />
            </div>
          </div>

          <div className="space-y-1 col-span-full">
               <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] pl-1">Order Notes</label>
               <textarea 
                 value={order.customer.notes}
                 onChange={e => setOrder({...order, customer: {...order.customer, notes: e.target.value}})}
                 rows="2"
                 className="w-full bg-white text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-2 focus:ring-zinc-950/5 focus:outline-none font-black placeholder:text-zinc-300" 
                 placeholder="ANY SPECIAL NOTES..."
               />
             </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-4 bg-black/5 rounded-[2rem] border border-black/5">
                 <div className="flex items-center gap-3 text-red-500">
                     <AlertCircle className="w-5 h-5" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Urgent Priority?</span>
                 </div>
                 <div 
                   onClick={() => setOrder({...order, isUrgent: !order.isUrgent})}
                   className={`w-14 h-8 rounded-full p-1.5 cursor-pointer transition-colors duration-300 ${order.isUrgent ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-black/10 shadow-inner'}`}
                 >
                  <motion.div 
                    animate={{ x: order.isUrgent ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-5 h-5 bg-white rounded-full shadow-md"
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
                           className="w-full bg-white text-zinc-950 font-black border border-black/5 p-3 rounded-xl focus:ring-2 focus:ring-red-500/10 focus:outline-none"
                         />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </section>

        {/* Section: Product Selector */}
        <section className={`glass-panel p-6 rounded-[2.5rem] space-y-6 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
           <div className="flex items-center gap-2 mb-2">
              <div className="bg-zinc-950/5 p-2 rounded-lg text-zinc-950">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-black text-lg text-zinc-950 uppercase tracking-tight">Choose Products</h3>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative" ref={searchRef}>
            <div className="relative group">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-950 transition-colors">
                 <Search className="w-4 h-4" />
               </div>
               <input 
                 type="text"
                 placeholder="SEARCH PRODUCTS..."
                 value={productSearch || (selectedProduct?.name || '')}
                 onChange={(e) => {
                   setProductSearch(e.target.value);
                   setIsProductListOpen(true);
                   if (e.target.value === '') setSelectedProductId('');
                 }}
                 onFocus={() => setIsProductListOpen(true)}
                 className="w-full bg-white text-zinc-950 border border-black/5 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-zinc-950/5 focus:outline-none placeholder:text-zinc-300 font-black tracking-widest uppercase"
               />
              
              <AnimatePresence>
                {isProductListOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute left-0 right-0 top-full mt-4 bg-white border border-black/5 rounded-[2rem] shadow-2xl z-50 max-h-80 overflow-y-auto overflow-x-hidden custom-scrollbar"
                  >
                    {products.filter(p => 
                      !p.isStockOut && 
                      p.name.toLowerCase().includes(productSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest">No products found</div>
                    ) : (
                      products.filter(p => 
                        !p.isStockOut &&
                        p.name.toLowerCase().includes(productSearch.toLowerCase())
                      ).map(p => (
                         <div 
                           key={p.id}
                           onClick={() => {
                             setSelectedProductId(p.id);
                             setSelectedVariantId(''); 
                             setSelectedSize(''); 
                             setProductSearch('');
                             setIsProductListOpen(false);
                           }}
                           className="p-5 hover:bg-black/5 cursor-pointer flex items-center justify-between border-b border-black/5 last:border-0 transition-colors"
                         >
                            <div>
                              <p className="text-xs font-black text-zinc-950 uppercase tracking-tight">{p.name}</p>
                              <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{p.category || 'Luxury Masterpiece'}</p>
                            </div>
                            <span className="text-[10px] font-black text-zinc-950 tracking-tighter">৳{p.basePrice?.toLocaleString()}</span>
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
              className="w-full bg-white text-zinc-950 font-black border border-black/5 p-3 rounded-xl focus:outline-none disabled:opacity-20"
             >
                <option value="" disabled>Select Color</option>
                {selectedProduct?.variants.map((v, idx) => (
                  <option 
                    key={idx} 
                    value={idx}
                    disabled={v.isStockOut}
                    className={v.isStockOut ? 'text-zinc-300' : ''}
                  >
                    {v.color} {v.isStockOut ? '(Stock Out)' : ''}
                  </option>
                ))}
                <option value="custom" className="text-blue-600 font-bold">+ Custom / Other Color</option>
             </select>

             <select 
              value={selectedSize}
              disabled={!selectedVariantId}
              onChange={e => setSelectedSize(e.target.value)}
              className="w-full md:col-span-2 bg-white text-zinc-950 font-black border border-black/5 p-4 rounded-2xl focus:outline-none disabled:opacity-20 appearance-none"
             >
                 <option value="" disabled>Select Size</option>
                 <option value="52/42/21 (S)">52/42/21 (S)</option>
                 <option value="54/44/22 (M)">54/44/22 (M)</option>
                 <option value="56/46/23 (L)">56/46/23 (L)</option>
                 <option value="Customize">Customize Size</option>
             </select>
          </div>

          <AnimatePresence>
            {selectedVariantId === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-2">Requested Color Name</label>
                <input 
                  type="text"
                  value={customColorName}
                  onChange={e => setCustomColorName(e.target.value)}
                  className="w-full bg-white text-zinc-950 border border-blue-100 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/10 focus:outline-none placeholder:text-zinc-300 font-black uppercase"
                  placeholder="e.g. Lavender, Sea Green..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedSize === 'Customize' && (
               <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className="grid grid-cols-4 gap-2 bg-black/5 p-4 rounded-xl border border-black/5"
               >
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Long</label>
                    <input type="number" placeholder='56' value={customMeasures.long} onChange={e => setCustomMeasures({...customMeasures, long: e.target.value})} className="w-full p-2 text-xs rounded-lg border-black/5 bg-white text-zinc-950 focus:outline-none font-bold"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Body</label>
                    <input type="number" placeholder='58' value={customMeasures.body} onChange={e => setCustomMeasures({...customMeasures, body: e.target.value})} className={`w-full p-2 text-xs rounded-lg bg-white text-zinc-950 border ${parseInt(customMeasures.body) > 58 ? 'border-red-400' : 'border-black/5'} focus:outline-none font-bold`}/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sleeve</label>
                    <input type="number" placeholder='22' value={customMeasures.sleeve} onChange={e => setCustomMeasures({...customMeasures, sleeve: e.target.value})} className="w-full p-2 text-xs rounded-lg border-black/5 bg-white text-zinc-950 focus:outline-none font-bold"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Shoulder</label>
                    <input type="number" placeholder='15' value={customMeasures.shoulder} onChange={e => setCustomMeasures({...customMeasures, shoulder: e.target.value})} className="w-full p-2 text-xs rounded-lg border-black/5 bg-white text-zinc-950 focus:outline-none font-bold"/>
                  </div>
                  <div className="col-span-4 text-[9px] text-zinc-400 font-black uppercase tracking-widest">
                    *Long &gt; 58 = +250 ৳ | Long &gt; 62 = +450 ৳ | Body &gt; 48 = +250 ৳
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedVariant && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 bg-white/40 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-black/5 shadow-sm"
              >
                 <div className="w-20 h-20 rounded-2xl overflow-hidden border border-black/5 shadow-inner">
                    <img src={selectedVariant.imageUrl} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-black text-zinc-950 text-base leading-tight uppercase tracking-tighter">{selectedProduct.name}</h4>
                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mt-1">
                      {selectedVariantId === 'custom' ? customColorName : selectedVariant.color} • SKU: {selectedVariant.sku}
                    </p>
                    <p className="text-xl font-black text-zinc-950 mt-1 uppercase tracking-tighter">৳ {selectedProduct.basePrice}</p>
                 </div>
                 <button 
                   type="button"
                   onClick={addItemToStage}
                   className="bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                 >
                   Add to List
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
                 className="bg-black/5 rounded-3xl p-5 border border-black/5 space-y-4"
               >
                 <div className="flex justify-between items-center text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em]">
                   <span>Items to Add ({stagedItems.length})</span>
                   <button type="button" onClick={confirmStagedToOrder} className="bg-zinc-950 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors font-black text-[9px]">
                     CONFIRM ITEMS
                   </button>
                 </div>
                 <div className="space-y-2">
                   {stagedItems.map(item => (
                     <div key={item.id} className="bg-white p-3 rounded-xl flex items-center justify-between border border-black/5 shadow-sm">
                       <div className="flex items-center gap-3">
                         <img src={item.image} className="w-8 h-8 rounded-lg object-cover ring-1 ring-black/5" />
                         <div>
                           <p className="text-[10px] font-black text-zinc-950 uppercase">{item.name}</p>
                           <p className="text-[8px] text-zinc-400 font-black uppercase">{item.color} • {item.size}</p>
                         </div>
                       </div>
                       <button type="button" onClick={() => removeItem(item.id, true)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
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
        <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[40px] text-zinc-950 shadow-2xl space-y-6 relative overflow-hidden border border-black/5">
           {/* Decorative element */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full blur-3xl -mr-10 -mt-10" />
           
           <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-tighter text-zinc-950">
             <ShoppingBag className="w-6 h-6 text-zinc-400" />
             Order Summary
           </h3>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {order.items.length === 0 ? (
              <div className="py-10 text-center opacity-30 text-sm">No items added yet.</div>
            ) : order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10" />
                    <div>
                      <p className="text-sm font-black leading-tight uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{item.color} • {item.size}</p>
                      {item.extraCharge > 0 && <p className="text-[10px] text-white/20 font-black">+ ৳ {item.extraCharge} Surcharge</p>}
                    </div>
                 </div>
                 <div className="text-right flex items-center gap-4">
                    <p className="font-black text-white tracking-tighter">৳ {item.price}</p>
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
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">Delivery Location</label>
                <select 
                 value={order.delivery.type}
                 onChange={e => {
                   const type = e.target.value;
                   const charge = settings?.deliveryRates?.[type] || (type === 'inside' ? 80 : 150);
                   setOrder({...order, delivery: { type, charge }});
                 }}
                 className="w-full bg-white/5 border border-white/10 p-2 rounded-xl text-xs font-black uppercase focus:outline-none"
                >
                   <option value="inside">Inside Dhaka (৳{settings?.deliveryRates?.inside || 80})</option>
                  <option value="outside">Outside Dhaka (৳{settings?.deliveryRates?.outside || 150})</option>
                </select>
              </div>

             <div className="space-y-2">
               <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">Choose Discount</label>
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
                className="w-full bg-white text-zinc-950 border border-black/5 p-2 rounded-xl text-sm focus:outline-none"
               >
                 <option value="0">No Campaign</option>
                 {settings?.campaigns.map((camp, idx) => (
                   <option key={idx} value={camp.percentage} className="text-zinc-950">{camp.name} ({camp.percentage}%)</option>
                 ))}
                 <option value="special" className="text-zinc-950">Special Permission</option>
               </select>
             </div>
          </div>

           {order.discount.campaign.includes("Special") && (
             <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="mt-4 p-4 bg-black/5 rounded-2xl border border-black/5 space-y-3">
                <div className="flex items-center gap-2 text-zinc-950">
                   <AlertTriangle className="w-3 h-3 text-red-500" />
                   <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Permission Required</div>
                </div>
                <input 
                  type="number"
                  placeholder="Discount %"
                  value={order.discount.percentage}
                  onChange={e => setOrder({...order, discount: { ...order.discount, percentage: parseInt(e.target.value) || 0 }})}
                  className="w-full bg-white border border-black/5 p-2 rounded-lg text-xs text-zinc-950"
                />
             </motion.div>
           )}

          {/* Advance Payment Logic */}
          <div className="bg-black/5 p-4 rounded-2xl border border-black/5 space-y-4">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white">
                      <CreditCard className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Advance Payment Required</span>
                 </div>
                 <input 
                   type="checkbox" 
                   checked={order.payment.advancePaid}
                   onChange={e => setOrder({...order, payment: {...order.payment, advancePaid: e.target.checked}})}
                   className="w-6 h-6 rounded-lg accent-zinc-950 cursor-pointer shadow-sm border-black/5"
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
                  className="bg-white border border-black/5 p-2 rounded-lg text-xs text-zinc-950"
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
                  className="bg-white border border-black/5 p-2 rounded-lg text-xs text-zinc-950 placeholder:text-zinc-300"
                 />
                 <input 
                  type="tel" 
                  placeholder="Sender Phone"
                  value={order.payment.senderPhone || ''}
                  onChange={e => setOrder({...order, payment: {...order.payment, senderPhone: e.target.value}})}
                  className="bg-white border border-black/5 p-2 rounded-lg text-xs text-zinc-950 placeholder:text-zinc-300"
                 />
                 <div className="col-span-full">
                    <input 
                      type="number" 
                      placeholder="Advance Amount (৳)"
                      value={order.payment.amount}
                      onChange={e => setOrder({...order, payment: {...order.payment, amount: parseFloat(e.target.value) || 0}})}
                      className="w-full bg-white border border-black/5 p-2 rounded-lg text-xs text-zinc-950"
                    />
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase block">Proof Photo (Compressed)</label>
                    <div className="flex items-center gap-3">
                       <label className="flex-1 bg-white border border-black/5 border-dashed p-4 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-black/5 transition-all shadow-inner">
                          <ExternalLink className="w-4 h-4 text-zinc-300" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Upload Digital Proof</span>
                          <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                       </label>
                       {order.payment.proofUrl && (
                         <div className="relative group">
                            <img src={order.payment.proofUrl} className="w-10 h-10 rounded-lg border border-black/5 object-cover" />
                            <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-white bg-zinc-950 rounded-full" />
                         </div>
                       )}
                       {uploading && <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />}
                    </div>
                 </div>
               </motion.div>
             )}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 pt-4">
             <div className="flex justify-between text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <span>Subtotal (Base)</span>
                <span>৳ {subtotal - order.items.reduce((a,c) => a+c.extraCharge, 0)}</span>
             </div>
             {order.items.some(i => i.extraCharge > 0) && (
               <div className="flex justify-between text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  <span>Size Surcharge / Adjustments</span>
                  <span>+ ৳ {order.items.reduce((a,c) => a+c.extraCharge, 0)}</span>
               </div>
             )}
             {discountAmount > 0 && (
               <div className="flex justify-between text-red-500 text-[10px] font-black uppercase tracking-widest">
                  <span>Discount ({order.discount.percentage}%)</span>
                  <span>- ৳ {discountAmount}</span>
               </div>
             )}
             <div className="flex justify-between text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <span>Delivery Fee</span>
                <span>+ ৳ {order.delivery.charge}</span>
             </div>
             <div className="flex justify-between text-zinc-950 font-black text-2xl pt-6 border-t border-black/5 mt-4 uppercase tracking-tighter">
                <span>Grand Total</span>
                <span className="text-zinc-950">৳ {total}</span>
             </div>
             <div className="flex justify-between text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                <span>Remaining Ledger Due</span>
                <span>৳ {due}</span>
             </div>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black py-5 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-[0.98] text-[11px] uppercase tracking-[0.3em]"
          >
            {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Authorize Order Protocol
          </button>
        </section>

      </div>
    </form>
  );
}
