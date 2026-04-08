"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
  PackageCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
    fetchProducts();
  }, []);

  const stats = useMemo(() => {
    const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
    const uniqueCategories = [...new Set(products.map(p => p.category))].length;
    return {
      count: products.length,
      variants: totalVariants,
      categories: uniqueCategories
    };
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      
      {/* Premium Hub Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Link href="/" className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-emerald-50 text-emerald-950 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                Inventory Intelligence
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-emerald-950 tracking-tighter">Product Vault</h1>
          <p className="text-gray-400 font-medium text-sm md:text-base max-w-xl">
             Manage your luxury collection. Track variants, update pricing, and curate your digital showroom.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={fetchProducts}
             className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 text-gray-400 shadow-sm transition-all active:scale-95"
           >
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
           <button 
             onClick={() => setShowForm(!showForm)}
             className="bg-emerald-900 text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-950 active:scale-95 transition-all flex items-center gap-3"
           >
             {showForm ? <Archive className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
             {showForm ? 'Vault Close' : 'Expand Collection'}
           </button>
        </div>
      </div>

      {/* Stats Bar */}
      {!showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="bg-emerald-50 text-emerald-950 p-4 rounded-2xl">
                 <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Units</p>
                 <h3 className="text-2xl font-black text-emerald-950">{stats.count} Products</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl">
                 <Palette className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Variations</p>
                 <h3 className="text-2xl font-black text-emerald-950">{stats.variants} SKUs</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl">
                 <Layers className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Series</p>
                 <h3 className="text-2xl font-black text-emerald-950">{stats.categories} Collections</h3>
              </div>
           </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto"
          >
            <ProductForm onSuccess={() => {
              setShowForm(false);
              fetchProducts();
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && products.length === 0 ? (
          Array(6).fill(0).map((_, i) => (
             <div key={i} className="h-96 bg-gray-50 rounded-[3rem] animate-pulse" />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full py-32 bg-white border-4 border-dashed border-gray-50 rounded-[4rem] text-center space-y-6">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <ShoppingBag className="w-10 h-10 text-gray-200" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black text-gray-950">Vault is Vacant</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Start building your premium inventory by clicking the 'Expand Collection' button above.</p>
             </div>
          </div>
        ) : products.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
               <img 
                src={product.variants[0]?.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80'} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt={product.name}
               />
               
               {/* Premium Overlays */}
               <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <span className="bg-emerald-950/80 backdrop-blur-md text-[10px] font-bold text-gold-400 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                    {product.category || 'Luxury'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                     <Sparkles className="w-3 h-3 text-gold-500" />
                     <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">৳ {product.basePrice}</span>
                  </div>
               </div>

               <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="p-8 space-y-6 flex-1 flex flex-col">
              <div className="space-y-1">
                <h3 className="font-serif font-black text-emerald-950 text-2xl uppercase tracking-tighter leading-tight group-hover:text-emerald-800 transition-colors">
                   {product.name}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory Reference: {String(product.id).substring(0, 8)}</p>
              </div>
              
              <div className="flex-1 flex flex-col justify-end space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                       {product.variants.slice(0, 4).map((v, i) => (
                          <div 
                            key={i}
                            className="w-10 h-10 rounded-full border-4 border-white overflow-hidden shadow-lg"
                            title={v.color}
                          >
                             <img src={v.imageUrl} className="w-full h-full object-cover" />
                          </div>
                       ))}
                       {product.variants.length > 4 && (
                          <div className="w-10 h-10 rounded-full bg-emerald-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-emerald-900 shadow-lg">
                             +{product.variants.length - 4}
                          </div>
                       )}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       {product.variants.length} Tones Available
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 group-hover:text-emerald-900 transition-colors">
                       <span className="text-[10px] font-black uppercase tracking-widest">View Specs</span>
                       <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
