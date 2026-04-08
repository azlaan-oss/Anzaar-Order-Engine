"use client";

import React, { useState } from 'react';
import { Plus, X, Upload, Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../utils/image-utils';
import { addProduct, uploadProductImage } from '../lib/firebase-utils';
import { toast } from 'sonner';

export default function ProductForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    basePrice: '',
    category: 'Abaya',
    variants: []
  });

  const [newVariant, setNewVariant] = useState({ color: '', image: null, preview: '' });

  const handleAddVariant = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImage(file);
    const preview = URL.createObjectURL(compressed);
    setNewVariant({ ...newVariant, image: compressed, preview });
  };

  const confirmAddVariant = () => {
    if (!newVariant.color || !newVariant.image) {
      toast.error('Please add color name and image');
      return;
    }
    setProduct({
      ...product,
      variants: [...product.variants, { ...newVariant, id: Date.now() }]
    });
    setNewVariant({ color: '', image: null, preview: '' });
  };

  const removeVariant = (id) => {
    setProduct({
      ...product,
      variants: product.variants.filter(v => v.id !== id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (product.variants.length === 0) {
      toast.error('Add at least one color variant');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating product...');

    try {
      // 1. Upload images and get URLs
      const updatedVariants = await Promise.all(
        product.variants.map(async (v) => {
          const url = await uploadProductImage(v.image, product.name);
          return { color: v.color, imageUrl: url, sku: `${product.name.toUpperCase().replace(/\s+/g, '-')}-${v.color.toUpperCase()}` };
        })
      );

      // 2. Save product to Firestore
      await addProduct({
        ...product,
        basePrice: parseFloat(product.basePrice),
        variants: updatedVariants
      });

      toast.success('Product added successfully!', { id: toastId });
      setProduct({ name: '', basePrice: '', category: 'Abaya', variants: [] });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to add product: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Product Name</label>
          <input 
            type="text" 
            required
            value={product.name}
            onChange={(e) => setProduct({...product, name: e.target.value})}
            className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-900/10 focus:outline-none"
            placeholder="e.g. Deep Emerald Abaya"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Base Price (BDT)</label>
          <input 
            type="number" 
            required
            value={product.basePrice}
            onChange={(e) => setProduct({...product, basePrice: e.target.value})}
            className="w-full bg-gray-50 text-gray-900 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-900/10 focus:outline-none"
            placeholder="3500"
          />
        </div>
      </div>

      {/* Variant Section */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg text-emerald-950">Color Variants</h3>
        
        <div className="flex flex-wrap gap-4">
          <AnimatePresence>
            {product.variants.map((v) => (
              <motion.div 
                key={v.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative group w-32 h-40 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
              >
                <img src={v.preview} className="w-full h-full object-cover" alt={v.color} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-white/90 p-2 text-[10px] font-bold text-center uppercase tracking-tighter">
                  {v.color}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add New Variant Box */}
          <div className="w-32 h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
            {newVariant.preview ? (
              <div className="absolute inset-0 p-1">
                <img src={newVariant.preview} className="w-full h-full object-cover rounded-xl" />
                <button 
                  onClick={() => setNewVariant({ color: '', image: null, preview: '' })}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAddVariant}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 font-bold uppercase">Upload Image</span>
              </>
            )}
          </div>
        </div>

        {/* Variant Inputs Row */}
        {newVariant.image && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-100"
          >
            <input 
              type="text"
              placeholder="Color Name (e.g. Olive Green)"
              value={newVariant.color}
              onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
              className="flex-1 bg-white text-gray-900 border border-emerald-200 p-2 rounded-xl text-sm focus:outline-none"
            />
            <button 
              type="button"
              onClick={confirmAddVariant}
              className="bg-emerald-900 text-white p-2 rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
        Save Product to Inventory
      </button>
    </form>
  );
}
