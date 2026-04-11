"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Upload, Check, Trash2, Image as ImageIcon, RotateCcw, Package, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../utils/image-utils';
import { addProduct, updateProduct, deleteProduct, uploadProductImage } from '../lib/firebase-utils';
import { toast } from 'sonner';

export default function ProductForm({ onSuccess, editData = null, onClose = null }) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    basePrice: '',
    discount: '0',
    category: 'Abaya',
    variants: [],
    isStockOut: false
  });
  const [activeVariantIdx, setActiveVariantIdx] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editData) {
      setProduct({
        ...editData,
        isStockOut: editData.isStockOut || false,
        // Convert URLs to previews for display
        variants: editData.variants.map(v => ({ 
          ...v, 
          isStockOut: v.isStockOut || false,
          preview: v.imageUrl, 
          id: v.sku || Date.now() + Math.random() 
        }))
      });
    }
  }, [editData]);

  const extractColor = (filename) => {
    // Remove extension
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    // Replace hyphens, underscores with spaces, and capitalize words
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAddVariant = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const toastId = toast.loading(`Processing ${files.length} image${files.length > 1 ? 's' : ''}...`);
    
    try {
      const processedVariants = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressImage(file);
          const preview = URL.createObjectURL(compressed);
          const colorName = extractColor(file.name);

          return { 
            id: Date.now() + Math.random(),
            color: colorName, 
            image: compressed, 
            preview,
            stock: 0,
            threshold: 2,
            isStockOut: false
          };
        })
      );

      setProduct(prev => ({
        ...prev,
        variants: [...prev.variants, ...processedVariants]
      }));
      
      toast.success(`Added ${files.length} color variant${files.length > 1 ? 's' : ''}`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Processing failed', { id: toastId });
    } finally {
      e.target.value = ''; // Reset input
    }
  };


  const removeVariant = (id) => {
    setProduct({
      ...product,
      variants: product.variants.filter(v => v.id !== id)
    });
  };

  const updateVariantImage = async (id, file) => {
    if (!file) return;
    const compressed = await compressImage(file);
    const preview = URL.createObjectURL(compressed);
    setProduct({
      ...product,
      variants: product.variants.map(v => v.id === id ? { ...v, image: compressed, preview } : v)
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeVariantIdx === null) return;
      // Prevent sliding if user is typing in an input
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Enter') e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight') setActiveVariantIdx((activeVariantIdx + 1) % product.variants.length);
      if (e.key === 'ArrowLeft') setActiveVariantIdx((activeVariantIdx - 1 + product.variants.length) % product.variants.length);
      if (e.key === 'Escape') setActiveVariantIdx(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVariantIdx, product.variants]);

  const handleDelete = async () => {
    const idToDelete = product.id || editData?.id;
    console.log("[DELETE-PROCESS] Initiated deletion for:", { 
      product_id: product.id, 
      editData_id: editData?.id, 
      idToDelete 
    });

    if (!idToDelete) {
      toast.error("Invalid product identifier - check console");
      return;
    }

    if (!window.confirm("Are you sure? This product and all its variants will be moved to the Trash Vault for 7 days.")) return;
    
    setLoading(true);
    try {
      await deleteProduct(idToDelete);
      toast.success("Product successfully removed from vault");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[DELETE-PROCESS] Error:", err);
      window.alert("System Error: " + err.message);
      toast.error("Failed to delete: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (product.variants.length === 0) {
      toast.error('Add at least one color variant');
      return;
    }

    setLoading(true);
    const mode = editData ? 'Updating' : 'Creating';
    const toastId = toast.loading(`${mode} product...`);

    try {
      // 1. Upload new images only
      const updatedVariants = await Promise.all(
        product.variants.map(async (v) => {
          if (v.image) {
            const url = await uploadProductImage(v.image, product.name, v.color || 'Standard');
            return { 
              color: v.color || 'Standard', 
              imageUrl: url || '', 
              stock: parseInt(v.stock) || 0,
              threshold: parseInt(v.threshold) || 2,
              isStockOut: v.isStockOut || false,
              sku: v.sku || `${product.name.toUpperCase().replace(/\s+/g, '-')}-${(v.color || 'ST').toUpperCase()}`
            };
          }
          return { 
            color: v.color || 'Standard', 
            imageUrl: v.imageUrl || '', 
            stock: parseInt(v.stock) || 0,
            threshold: parseInt(v.threshold) || 2,
            isStockOut: v.isStockOut || false,
            sku: v.sku || `${product.name.toUpperCase().replace(/\s+/g, '-')}-${(v.color || 'ST').toUpperCase()}`
          };
        })
      );

      const finalData = {
        ...product,
        basePrice: parseFloat(product.basePrice),
        discount: parseFloat(product.discount) || 0,
        isStockOut: product.isStockOut || false,
        variants: updatedVariants
      };

      if (editData) {
        await updateProduct(editData.id, finalData);
        toast.success('Product updated successfully!', { id: toastId });
      } else {
        await addProduct(finalData);
        toast.success('Product added successfully!', { id: toastId });
      }

      setProduct({ name: '', basePrice: '', discount: '0', category: 'Abaya', variants: [] });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] border border-black/5 shadow-2xl space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar relative">
      {onClose && (
        <button type="button" onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-black text-zinc-950">
            {editData ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {editData ? `Managing: ${editData.name}` : 'Fill in the details to add this to your inventory'}
          </p>
        </div>

        {/* Master Stock Toggle */}
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${product.isStockOut ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest ${product.isStockOut ? 'text-red-600' : 'text-zinc-700'}`}>Stock Status</span>
            <span className="text-xs font-bold text-gray-500">{product.isStockOut ? 'Currently Unavailable' : 'Available for Orders'}</span>
          </div>
          <button 
            type="button"
            onClick={() => setProduct({ ...product, isStockOut: !product.isStockOut })}
            className={`w-14 h-7 rounded-full p-1 relative transition-colors duration-500 ${product.isStockOut ? 'bg-red-500' : 'bg-zinc-950'}`}
          >
            <motion.div 
              animate={{ x: product.isStockOut ? 28 : 0 }}
              className="w-5 h-5 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Name</label>
          <input 
            type="text" 
            required
            value={product.name}
            onChange={(e) => setProduct({...product, name: e.target.value})}
            className="w-full bg-zinc-50 text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-4 focus:ring-zinc-950/5 focus:outline-none transition-all font-bold placeholder:text-zinc-200"
            placeholder="Product Name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Price (BDT)</label>
          <input 
            type="number" 
            required
            value={product.basePrice}
            onChange={(e) => setProduct({...product, basePrice: e.target.value})}
            className="w-full bg-zinc-50 text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-4 focus:ring-zinc-950/5 focus:outline-none transition-all font-bold placeholder:text-zinc-200"
            placeholder="Price"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Discount (BDT)</label>
          <input 
            type="number" 
            value={product.discount}
            onChange={(e) => setProduct({...product, discount: e.target.value})}
            className="w-full bg-zinc-50 text-zinc-950 border border-black/5 p-4 rounded-2xl focus:ring-4 focus:ring-zinc-950/5 focus:outline-none transition-all font-bold placeholder:text-zinc-200"
            placeholder="0"
          />
        </div>
      </div>

      {/* Variant Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="font-serif font-black text-xl text-zinc-950">Color Variants</h3>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{product.variants.length} Active Colors</span>
        </div>
        
        <div className="flex flex-wrap gap-6">
          <AnimatePresence>
            {product.variants.map((v, idx) => (
              <motion.div 
                key={v.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative group w-36 h-48 bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                 <img 
                   src={v.preview || v.imageUrl} 
                   className="w-full h-full object-cover cursor-zoom-in" 
                   alt={v.color} 
                   onClick={() => setActiveVariantIdx(idx)}
                 />

                 {/* Instant Remove Cross */}
                 <button 
                   type="button"
                   onClick={(e) => { e.stopPropagation(); removeVariant(v.id); }}
                   className="absolute top-2 right-2 p-1.5 bg-white/90 text-zinc-400 hover:text-red-500 rounded-full shadow-lg border border-black/5 opacity-0 group-hover:opacity-100 transition-all z-10"
                 >
                    <X className="w-3 h-3" />
                 </button>

                 <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveVariantIdx(idx)}
                      className="text-zinc-950 text-[8px] font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-black/5 hover:bg-zinc-50 flex items-center gap-2 shadow-lg"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      View Details
                    </button>
                 </div>
                 <div className="absolute inset-x-0 bottom-0 py-2 bg-white/50 backdrop-blur-md border-t border-black/5">
                   <p className="text-[10px] font-black text-zinc-950 text-center uppercase tracking-tighter truncate">{v.color}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add New Variant Box */}
          <div className="w-36 h-48 border-4 border-dashed border-black/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 bg-zinc-50 hover:bg-zinc-100 hover:border-black/10 transition-all relative group">
            <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-zinc-950 group-hover:text-white transition-all text-zinc-400">
               <Upload className="w-6 h-6" />
            </div>
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={handleAddVariant}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest text-center px-4">
              Add Colors<br/>
              <span className="text-[8px] opacity-60">(Select one or more)</span>
            </span>
          </div>
        </div>

        {/* Variant Inputs Row */}
        <AnimatePresence>
        </AnimatePresence>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-50">
        {editData && (
          <button 
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-50 text-red-600 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Product
          </button>
        )}
        <button 
          type="submit" 
          disabled={loading}
          className="flex-[2] bg-zinc-950 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-950/10 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
          ) : (
            editData ? <RotateCcw className="w-4 h-4" /> : <Package className="w-4 h-4" />
          )}
          {editData ? 'Save Changes' : 'Create Product'}
        </button>
      </div>

      {/* Deep Variant Inspector Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {activeVariantIdx !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000000] bg-zinc-50/98 backdrop-blur-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Control Header */}
              <div className="p-8 flex items-center justify-between border-b border-black/5">
                 <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/5">
                       <ImageIcon className="text-zinc-400 w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-zinc-950 text-xl font-serif font-black">
                          {product.variants[activeVariantIdx]?.color || 'Loading...'}
                       </h3>
                       <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-[0.2em]">
                          Master Variation Portal • {activeVariantIdx + 1}/{product.variants.length}
                       </p>
                    </div>
                 </div>
                 <button 
                   type="button"
                   onClick={() => setActiveVariantIdx(null)}
                   className="bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 p-4 rounded-full transition-all border border-black/5 shadow-sm"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                 {/* Image Section */}
                 <div className="flex-1 relative flex items-center justify-center bg-zinc-100/50 group">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveVariantIdx((activeVariantIdx - 1 + product.variants.length) % product.variants.length); }}
                      className="absolute left-8 z-10 p-5 bg-white text-zinc-950 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all border border-black/5"
                    >
                       <ChevronRight className="w-8 h-8 rotate-180" />
                    </button>
                    
                    <motion.img 
                      key={activeVariantIdx}
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -100, opacity: 0 }}
                      src={product.variants[activeVariantIdx]?.preview || product.variants[activeVariantIdx]?.imageUrl} 
                      className="max-w-full max-h-full object-contain p-12 drop-shadow-2xl"
                    />

                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveVariantIdx((activeVariantIdx + 1) % product.variants.length); }}
                      className="absolute right-8 z-10 p-5 bg-white text-zinc-950 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all border border-black/5"
                    >
                       <ChevronRight className="w-8 h-8" />
                    </button>
                 </div>

                 {/* Interaction Panel */}
                  <div className="w-full md:w-[450px] bg-white p-12 flex flex-col gap-12 border-l border-black/5 shadow-2xl">
                    <div className="space-y-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Modify Color Alias</label>
                          <input 
                             type="text"
                             value={product.variants[activeVariantIdx]?.color || ''}
                             onChange={(e) => {
                                const newVariants = [...product.variants];
                                if (newVariants[activeVariantIdx]) {
                                   newVariants[activeVariantIdx].color = e.target.value;
                                   setProduct({...product, variants: newVariants});
                                }
                             }}
                             onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                             className="w-full bg-zinc-50 text-zinc-950 border border-black/5 p-5 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-zinc-950/5 focus:outline-none transition-all"
                          />
                       </div>

                       {/* Variant Stock Toggle */}
                       <div className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between ${product.variants[activeVariantIdx]?.isStockOut ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-black/5'}`}>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Availability</p>
                             <p className={`text-sm font-bold ${product.variants[activeVariantIdx]?.isStockOut ? 'text-red-500' : 'text-zinc-600'}`}>
                                {product.variants[activeVariantIdx]?.isStockOut ? 'Stock Out' : 'Available'}
                             </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const newVariants = [...product.variants];
                              newVariants[activeVariantIdx].isStockOut = !newVariants[activeVariantIdx].isStockOut;
                              setProduct({ ...product, variants: newVariants });
                            }}
                            className={`w-14 h-7 rounded-full p-1 relative transition-colors duration-500 ${product.variants[activeVariantIdx]?.isStockOut ? 'bg-red-500' : 'bg-zinc-950'}`}
                          >
                            <motion.div 
                              animate={{ x: product.variants[activeVariantIdx]?.isStockOut ? 28 : 0 }}
                              className="w-5 h-5 bg-white rounded-full shadow-lg"
                            />
                          </button>
                       </div>

                       <div className="pt-8 flex flex-col gap-4">
                          <label className="w-full bg-zinc-950 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer hover:bg-black transition-all shadow-xl active:scale-95">
                             <Upload className="w-5 h-5" />
                             Replace Core Image
                             <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => updateVariantImage(product.variants[activeVariantIdx].id, e.target.files[0])}
                             />
                          </label>

                          <button 
                             type="button"
                             onClick={() => {
                                const vId = product.variants[activeVariantIdx].id;
                                setActiveVariantIdx(null);
                                removeVariant(vId);
                             }}
                             className="w-full bg-white text-red-500 border border-black/5 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                          >
                             <Trash2 className="w-5 h-5" />
                             Evict Variant
                          </button>
                       </div>
                    </div>

                    <div className="mt-auto bg-zinc-50 p-8 rounded-[3rem] border border-black/5 space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Live Metadata SKU</span>
                       </div>
                       <p className="text-zinc-950 text-xs font-mono break-all opacity-60">{product.variants[activeVariantIdx]?.sku || 'GENERATING ON COMMIT...'}</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </form>
  );
}
