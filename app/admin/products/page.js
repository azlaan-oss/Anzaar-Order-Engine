"use client";

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
  BarChart3
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
    
    // Low stock calculation
    const lowStockItems = products.filter(p => 
      p.variants?.some(v => v.stock <= (v.threshold || 2))
    ).length;

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
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-12 bg-emerald-950/90 backdrop-blur-md"
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
        </div>

         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
               <h1 className="text-5xl font-serif font-black text-emerald-950 tracking-tight">The Product Vault</h1>
               <div className="flex items-center gap-3">
                  <span className="w-12 h-1 bg-gold-500 rounded-full" />
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Master Inventory Control</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="flex-1 md:w-80 bg-emerald-950 p-1 rounded-2xl flex items-center px-4 gap-3 shadow-xl">
                  <Search className="text-emerald-500 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search Vault (Name, Category)..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-white text-[10px] font-bold w-full focus:outline-none placeholder:text-white/20 h-10"
                  />
               </div>
               <button 
                  onClick={() => setShowForm(true)}
                  className="bg-emerald-900 text-gold-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-900/20 hover:bg-emerald-950 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
               >
                  <Plus className="w-4 h-4" />
                  Expand Collection
               </button>
            </div>
         </div>
      </div>

       {/* Intelligence Dashboard */}
      {!showForm && (
        <div className="space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                 <PerformanceAnalytics 
                    title="Revenue Velocity (Est.)" 
                    data={stats.salesData} 
                    height={280}
                 />
              </div>
              <div className="space-y-6">
                 <div className="bg-emerald-950 p-8 rounded-[3rem] text-white space-y-4 shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Zap className="w-24 h-24" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Inventory Health</p>
                    <h3 className="text-3xl font-serif font-black tracking-tighter">Optimal Flow</h3>
                    <div className="pt-4 flex items-center gap-4">
                       <span className="text-4xl font-black">{Math.round((stats.count / 50) * 100)}%</span>
                       <p className="text-[10px] font-bold text-emerald-200 uppercase leading-relaxed">
                          Capacity utilized based on<br/>active SKU density.
                       </p>
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl">
                          <AlertTriangle className="w-5 h-5" />
                       </div>
                       <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">High Priority</span>
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-emerald-950">{stats.lowStock} Low Stock Items</h4>
                       <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Requiring immediate replenishment</p>
                    </div>
                 </div>
              </div>
           </div>

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
        </div>
      )}

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading && products.length === 0 ? (
          Array(6).fill(0).map((_, i) => (
             <div key={i} className="h-96 bg-gray-50 rounded-[3rem] animate-pulse" />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-32 bg-white border-4 border-dashed border-gray-50 rounded-[4rem] text-center space-y-6">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <ShoppingBag className="w-10 h-10 text-gray-200" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black text-gray-950">No Matches in Vault</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">Try adjusting your search query or add a new mastery unit to the collection.</p>
             </div>
          </div>
        ) : filteredProducts.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedProduct(product)}
            className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col cursor-pointer active:scale-95"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
               <img 
                src={product.variants[0]?.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80'} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                alt={product.name}
               />
               
                {/* Premium Overlays */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                      <span className="bg-emerald-950/80 backdrop-blur-md text-[10px] font-bold text-gold-400 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                        {product.category || 'Luxury'}
                      </span>
                      {product.variants?.some(v => v.stock <= (v.threshold || 2)) && (
                         <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase animate-pulse">
                            Low Stock
                         </span>
                      )}
                   </div>
                   <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                      <Sparkles className="w-3 h-3 text-gold-500" />
                      <span className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">৳ {product.basePrice}</span>
                   </div>
                </div>

                {/* QR Code Quick Action */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${product.id}`, '_blank');
                    }}
                    className="p-3 bg-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                   >
                     <QrCode className="w-5 h-5 text-emerald-950" />
                   </button>
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

                 <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900/40 group-hover:text-emerald-900 transition-colors">
                       <span className="text-[10px] font-black uppercase tracking-widest">Master Configure</span>
                       <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
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
