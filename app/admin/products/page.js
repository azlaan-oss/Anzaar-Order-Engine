"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ProductForm from '../../../components/ProductForm';
import { getProducts } from '../../../lib/firebase-utils';
import { 
  Plus, 
  ShoppingBag, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  Palette, 
  Archive,
  ChevronRight,
  Sparkles,
  PackageCheck,
  Zap,
  Clock,
  QrCode,
  AlertTriangle,
  Search,
  TrendingUp,
  BarChart3,
  Edit,
  Bell
} from 'lucide-react';
import PerformanceAnalytics from '../../../components/PerformanceAnalytics';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const stats = useMemo(() => {
    const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
    const uniqueCategories = [...new Set(products.map(p => p.category))].length;
    
    // Low stock calculation removed
    const lowStockItems = 0;

    // Mock Sales Data for Graph
    const salesData = [
      { label: 'Jan', value: 1200 },
      { label: 'Feb', value: 2100 },
      { label: 'Mar', value: 1800 },
      { label: 'Apr', value: 2400 },
      { label: 'May', value: 3200 },
      { label: 'Jun', value: 2900 },
    ];

    return {
      count: products.length,
      variants: totalVariants,
      categories: uniqueCategories,
      lowStock: lowStockItems,
      salesData
    };
  }, [products]);

  return (
    <>
      {mounted && (showForm || selectedProduct) && createPortal(
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-12 bg-zinc-950/30 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              setSelectedProduct(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <ProductForm 
                editData={selectedProduct}
                onClose={() => {
                  setShowForm(false);
                  setSelectedProduct(null);
                }}
                onSuccess={() => {
                  setShowForm(false);
                  setSelectedProduct(null);
                  fetchProducts();
                }} 
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      <div className="max-w-[1600px] mx-auto space-y-12 pb-10 px-6">
      
      {/* Super Advance Dynamic Hero Header */}
      <div className="relative mt-8 group">
        <div className="absolute -inset-4 bg-zinc-950/5 rounded-[4rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-1000" />
        <div className="relative bg-white rounded-[3.5rem] overflow-hidden border border-black/5 shadow-xl">
          
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-zinc-100 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-50 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="relative p-10 md:p-14 flex flex-col xl:flex-row items-center justify-between gap-12">
            
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 border border-black/5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Inventory Dashboard</span>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-5xl md:text-6xl font-black text-zinc-950 tracking-tight">
                  Product <span className="text-zinc-300">Inventory</span>
                </h1>
                <p className="text-zinc-400 font-black text-xs uppercase tracking-[0.4em] pl-1">Manage Your Collection</p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                   {products.slice(0, 5).map((p, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-zinc-100 shadow-xl">
                         <img src={p.variants[0]?.imageUrl} className="w-full h-full object-cover grayscale" />
                      </div>
                   ))}
                </div>
                <div className="h-10 w-[1px] bg-black/5 mx-2" />
                <div className="flex flex-col text-left">
                   <span className="text-zinc-950 text-sm font-black tracking-tight">{stats.count}+ Products</span>
                   <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Active in shop</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full xl:max-w-2xl">
              {[
                { label: 'Total Products', value: stats.count, icon: PackageCheck, color: 'text-zinc-400', bg: 'bg-zinc-50' },
                { label: 'Color Variants', value: stats.variants, icon: Palette, color: 'text-zinc-400', bg: 'bg-zinc-50' },
                { label: 'Categories', value: stats.categories, icon: Layers, color: 'text-zinc-400', bg: 'bg-zinc-50' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/50 backdrop-blur-sm border border-black/5 p-6 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-2 shadow-sm"
                >
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</p>
                    <h3 className="text-2xl font-black text-zinc-950 tracking-tighter">{stat.value}</h3>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-4 w-full md:w-80">
                <div className="relative group/search">
                   <div className="absolute inset-0 bg-zinc-950/5 blur-xl rounded-2xl opacity-0 group-hover/search:opacity-100 transition-opacity" />
                   <div className="relative bg-zinc-100 border border-black/5 p-1.5 rounded-2xl flex items-center px-5 gap-4 focus-within:bg-white focus-within:shadow-xl transition-all">
                     <Search className="text-zinc-400 w-5 h-5" />
                     <input 
                       type="text" 
                       placeholder="Search items..." 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="bg-transparent border-none text-zinc-950 text-[11px] font-black w-full focus:outline-none placeholder:text-zinc-300 h-10 tracking-widest"
                     />
                   </div>
                </div>
 
                <button 
                   onClick={() => setShowForm(true)}
                   className="relative group/btn"
                >
                   <div className="relative bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                     <div className="bg-white p-1.5 rounded-lg text-zinc-950">
                        <Plus className="w-4 h-4" />
                     </div>
                     Add New Product
                   </div>
                </button>
            </div>

          </div>
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading && products.length === 0 ? null : filteredProducts.length === 0 ? (
          <div className="col-span-full py-32 bg-white border border-black/5 rounded-[4rem] text-center space-y-6">
             <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <ShoppingBag className="w-10 h-10 text-zinc-200" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-zinc-950 uppercase tracking-widest">No Matches in Vault</h3>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto">Try adjusting your search query or add a new mastery unit to the collection.</p>
             </div>
          </div>
        ) : filteredProducts.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-50 cursor-pointer" onClick={() => setSelectedProduct(product)}>
               <img 
                src={product.variants[0]?.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80'} 
                className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${product.isStockOut ? 'grayscale contrast-125 opacity-40' : ''}`} 
                alt={product.name}
               />
               
               {product.isStockOut && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-red-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-600/50 -rotate-12 border-4 border-white">
                       Stock Out
                    </div>
                 </div>
               )}

               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                   <h3 className="font-black text-zinc-950 text-xl uppercase tracking-tighter leading-tight group-hover:text-zinc-600 transition-colors">
                      {product.name}
                   </h3>
                   <span className="text-sm font-black text-zinc-950">৳ {product.basePrice}</span>
                </div>
                <div className="flex items-center gap-2">
                   <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Ref: {String(product.id).substring(0, 8)}</p>
                   <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">• {product.category || 'Luxury'}</span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-end space-y-3">
                 <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {product.variants.slice(0, 4).map((v, i) => (
                           <div 
                             key={i}
                             className={`w-8 h-8 rounded-full border border-black/5 overflow-hidden shadow-sm relative ${v.isStockOut ? 'ring-2 ring-red-500' : ''}`}
                             title={v.color + (v.isStockOut ? ' (Stock Out)' : '')}
                           >
                              <img src={v.imageUrl} className={`w-full h-full object-cover ${v.isStockOut ? 'grayscale opacity-50' : ''}`} />
                              {v.isStockOut && <div className="absolute inset-0 bg-red-500/20" />}
                           </div>
                        ))}
                        {product.variants.length > 4 && (
                           <div className="w-8 h-8 rounded-full bg-zinc-100 border border-black/5 flex items-center justify-center text-[8px] font-black text-zinc-950 shadow-sm">
                              +{product.variants.length - 4}
                           </div>
                        )}
                     </div>
                     <div className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                        {product.variants.length} Tones
                     </div>
                  </div>
 
                  <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                     <button onClick={() => setSelectedProduct(product)} className="p-3 bg-zinc-100 text-zinc-950 rounded-xl hover:bg-zinc-950 hover:text-white transition-all shadow-sm">
                       <Edit className="w-4 h-4" />
                     </button>
                     <button className="relative w-11 h-11 bg-zinc-100 hover:bg-zinc-200 rounded-2xl flex items-center justify-center border border-black/5 transition-all group shadow-sm">
                       <Bell className="w-5 h-5 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
                       <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                     </button>
                  </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    </>
  );
}
