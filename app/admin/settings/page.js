"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Settings, 
  Save, 
  Database, 
  Truck, 
  Tag, 
  RefreshCw, 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Globe,
  BellRing,
  Image as ImageIcon,
  Upload,
  Trash2 as TrashIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { uploadProductImage } from '../../../lib/firebase-utils';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('sheets'); // sheets, logistics, campaigns
  
  const [settings, setSettings] = useState({
    activeSheetId: '',
    activeSheetTab: 'Sheet1',
    orderPrefix: 'A0226-',
    orderSequence: 1,
    deliveryRates: { inside: 80, outside: 150 },
    logoUrl: '',
    logoScale: 1.5,
    campaigns: [
      { name: 'None', percentage: 0 },
      { name: 'Eid Promo', percentage: 5 },
      { name: 'Ramadan Sale', percentage: 10 }
    ]
  });

  useEffect(() => {
    let timeoutId;
    const fetchSettings = async () => {
      timeoutId = setTimeout(() => {
        setLoading(false);
        toast.error("Firebase connection taking too long. Using saved settings.");
      }, 5000);

      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    fetchSettings();
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Updating Settings...");
    try {
      await setDoc(doc(db, "settings", "global"), settings);
      toast.success("Settings updated successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to update settings", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'sheets', label: 'Order Sync', icon: Database },
    { id: 'branding', label: 'Branding', icon: ImageIcon },
    { id: 'logistics', label: 'Shipping', icon: Truck },
    { id: 'campaigns', label: 'Discount', icon: Tag },
  ];

  return (
    <div className={`max-w-6xl mx-auto space-y-12 pb-20 px-4 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Premium Settings Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Link href="/" className="p-2 bg-white rounded-full border border-black/5 hover:bg-zinc-50 text-zinc-950 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
             </Link>
             <div className="px-3 py-1 bg-white text-zinc-950 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-black/5 shadow-sm">
                System Core v3.0
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Settings <span className="text-zinc-300">Hub</span></h1>
          <p className="text-zinc-400 font-medium text-sm md:text-base max-w-xl uppercase tracking-widest text-[10px]">
             Configure your site settings. Manage sync ID, adjust logistics, and set campaigns.
          </p>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-zinc-950 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-900 active:scale-95 transition-all flex items-center gap-4 relative group overflow-hidden border border-black/5"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-125 transition-transform" />}
          Update Engine
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Tab Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Navigation Sidebar-less */}
        <div className="lg:col-span-3 space-y-3">
           {tabs.map((tab) => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all border ${
                activeTab === tab.id 
                ? 'bg-zinc-950 text-white border-black/5 shadow-2xl scale-105' 
                : 'bg-white border-black/5 text-zinc-400 hover:bg-zinc-50'
              }`}
             >
               <div className="flex items-center gap-4">
                  <div className={`${activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-zinc-50 text-zinc-300'} p-3 rounded-2xl transition-colors shadow-inner`}>
                    <tab.icon className="w-5 h-5" />
                  </div>
                  <span className={`font-black text-[10px] uppercase tracking-[0.2em] ${activeTab === tab.id ? 'opacity-100' : 'opacity-100'}`}>{tab.label}</span>
               </div>
               {activeTab === tab.id && <Zap className="w-4 h-4 text-white fill-white animate-pulse" />}
             </button>
           ))}

            <div className="pt-8 mt-8 border-t border-black/5 space-y-6">
               <div className="flex items-center gap-4 px-5">
                  <ShieldCheck className="w-5 h-5 text-zinc-300" />
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Protocol Secured</span>
               </div>
               <div className="bg-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group border border-black/5">
                  <Globe className="absolute -top-10 -right-10 w-24 h-24 text-black/5 group-hover:scale-150 transition-transform duration-700" />
                  <h4 className="text-zinc-950 font-black text-lg mb-2 relative z-10 uppercase tracking-tighter">Global Access</h4>
                  <p className="text-zinc-400 text-[9px] leading-relaxed relative z-10 font-black uppercase tracking-widest">Your engine is synced via Google Cloud Platform v4.</p>
               </div>
            </div>
        </div>

        {/* Dynamic Protocol Panel */}
        <div className="lg:col-span-9">
           <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-10 rounded-[3.5rem] border border-black/5 shadow-xl min-h-[500px] flex flex-col"
              >
                {activeTab === 'sheets' && (
                  <div className="space-y-10 flex-1">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Google Cloud Sync</h3>
                       <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Coordinate where your strategic order data is processed and stored.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1 col-span-full">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2">Active Spreadsheet ID</label>
                        <input 
                         type="text" 
                         value={settings.activeSheetId}
                         onChange={e => setSettings({...settings, activeSheetId: e.target.value})}
                         className="w-full bg-zinc-50 text-zinc-950 font-mono text-sm border border-black/5 focus:border-black/20 p-5 rounded-3xl outline-none transition-all shadow-inner" 
                         placeholder="Enter ID..."
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2">Sheet Tab Name</label>
                        <input 
                         type="text" 
                         value={settings.activeSheetTab || ''}
                         onChange={e => setSettings({...settings, activeSheetTab: e.target.value})}
                         className="w-full bg-zinc-50 text-zinc-950 font-black text-sm border border-black/5 focus:border-black/20 p-5 rounded-3xl outline-none transition-all shadow-inner uppercase tracking-widest" 
                         placeholder="e.g. June 2026"
                        />
                      </div>
                      
                       <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2">Sequence ID Architecture</label>
                        <div className="flex gap-4">
                          <input 
                           type="text" 
                           value={settings.orderPrefix || ''}
                           onChange={e => setSettings({...settings, orderPrefix: e.target.value})}
                           className="w-32 bg-zinc-50 text-zinc-950 font-black text-sm border border-black/5 focus:border-black/20 p-5 rounded-3xl outline-none text-center shadow-inner" 
                           placeholder="PRE-"
                          />
                          <input 
                           type="number" 
                           value={settings.orderSequence || 1}
                           onChange={e => setSettings({...settings, orderSequence: parseInt(e.target.value) || 1})}
                           className="flex-1 bg-zinc-50 text-zinc-950 font-black text-sm border border-black/5 focus:border-black/20 p-5 rounded-3xl outline-none text-center shadow-inner" 
                           placeholder="1"
                          />
                        </div>
                        <p className="text-[9px] text-zinc-300 font-black uppercase tracking-widest pl-2 mt-2 italic">Output Example: {(settings.orderPrefix || '') + String(settings.orderSequence || 1).padStart(2, '0')}</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'branding' && (
                  <div className="space-y-10 flex-1">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Brand Identity</h3>
                       <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Upload your company logo to be used across invoices and system headers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-1 col-span-full">
                         <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-2">Business Name</label>
                         <input 
                          type="text" 
                          value={settings.brandName || ''}
                          onChange={e => setSettings({...settings, brandName: e.target.value})}
                          className="w-full bg-zinc-50 text-zinc-950 font-black text-sm border border-black/5 focus:border-black/20 p-5 rounded-3xl outline-none transition-all shadow-inner uppercase tracking-widest" 
                          placeholder="e.g. ANZAAR CLOTHING"
                         />
                       </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-12 border border-black/5 rounded-[3rem] bg-zinc-50 space-y-6">
                       {settings.logoUrl ? (
                         <div className="relative group">
                           <div className="w-40 h-40 bg-white rounded-3xl shadow-xl border border-zinc-100 p-2 overflow-hidden flex items-center justify-center">
                              <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                           </div>
                           <button 
                             onClick={() => setSettings({...settings, logoUrl: ''})}
                             className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <TrashIcon className="w-4 h-4" />
                           </button>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-zinc-100 text-zinc-300 rounded-3xl flex items-center justify-center">
                               <ImageIcon className="w-10 h-10" />
                            </div>
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest text-center">No logo detected in engine</p>
                         </div>
                       )}

                       <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-black/5">
                          <Upload className="w-4 h-4" />
                          {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                               const file = e.target.files[0];
                               if (file) {
                                 try {
                                   const url = await uploadProductImage(file);
                                   setSettings({...settings, logoUrl: url});
                                   toast.success("Logo processed successfully");
                                 } catch (err) {
                                   toast.error("Failed to process image");
                                 }
                               }
                            }}
                          />
                       </label>
                       <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest">Recommended: Square Format (PNG/JPG)</p>

                       {settings.logoUrl && (
                         <div className="w-full max-w-xs space-y-4 pt-4 border-t border-black/5">
                            <div className="flex items-center justify-between">
                               <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Engine Logo Scale</label>
                               <span className="text-[10px] font-black text-zinc-950 bg-zinc-100 px-2 py-1 rounded-lg">{(settings.logoScale || 1.5).toFixed(1)}x</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.5" 
                              max="3" 
                              step="0.1"
                              value={settings.logoScale || 1.5}
                              onChange={e => setSettings({...settings, logoScale: parseFloat(e.target.value)})}
                              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-950"
                            />
                            <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                               <span>Minimum</span>
                               <span>Optimal</span>
                               <span>Maximum</span>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'logistics' && (
                  <div className="space-y-10 flex-1">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Shipping Logistics</h3>
                       <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Standardize your national shipping rates for precision calculation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-zinc-50 p-8 rounded-[2.5rem] space-y-6 border border-black/5 flex flex-col justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl border border-black/5 flex items-center justify-center text-zinc-950 shadow-sm">
                                 <Zap className="w-6 h-6" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-zinc-950 uppercase tracking-tight">Dhaka Metro</p>
                                 <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">Internal Zone A</p>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Protocol Rate (৳)</label>
                              <input 
                               type="number" 
                               value={settings.deliveryRates?.inside || 80}
                               onChange={e => setSettings({...settings, deliveryRates: {...settings.deliveryRates, inside: parseInt(e.target.value) || 0}})}
                               className="w-full bg-white text-zinc-950 font-black text-2xl border border-black/5 p-5 rounded-3xl outline-none focus:border-black/20 transition-all text-center shadow-inner" 
                              />
                           </div>
                        </div>

                        <div className="bg-zinc-50 p-8 rounded-[2.5rem] space-y-6 border border-black/5 flex flex-col justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl border border-black/5 flex items-center justify-center text-zinc-950 shadow-sm">
                                 <Truck className="w-6 h-6" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-zinc-950 uppercase tracking-tight">Outside Dhaka</p>
                                 <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">External Zone B</p>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Protocol Rate (৳)</label>
                              <input 
                               type="number" 
                               value={settings.deliveryRates?.outside || 150}
                               onChange={e => setSettings({...settings, deliveryRates: {...settings.deliveryRates, outside: parseInt(e.target.value) || 0}})}
                               className="w-full bg-white text-zinc-950 font-black text-2xl border border-black/5 p-5 rounded-3xl outline-none focus:border-black/20 transition-all text-center shadow-inner" 
                              />
                           </div>
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === 'campaigns' && (
                  <div className="space-y-10 flex-1">
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Discount Core</h3>
                       <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Calibrate seasonal campaigns to apply automated fiscal adjustments.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                       {settings.campaigns.map((camp, idx) => (
                         <div key={idx} className="bg-zinc-50 p-6 rounded-3xl border border-black/5 flex items-center justify-between group hover:bg-zinc-100 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl border border-black/5 flex items-center justify-center text-zinc-950 shadow-sm group-hover:scale-110 transition-transform">
                                  <Tag className="w-5 h-5" />
                               </div>
                               <div>
                                 <p className="font-black text-zinc-950 text-sm uppercase tracking-widest">{camp.name}</p>
                                 <p className="text-[10px] text-zinc-400 font-black">Fiscal Adjustment Protocol</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <input 
                                type="number" 
                                value={camp.percentage}
                                onChange={e => {
                                  const newCamps = [...settings.campaigns];
                                  newCamps[idx].percentage = parseInt(e.target.value) || 0;
                                  setSettings({...settings, campaigns: newCamps});
                                }}
                                className="w-24 bg-white text-zinc-950 border border-black/5 p-4 rounded-2xl text-center font-black text-lg outline-none shadow-inner"
                               />
                               <span className="font-black text-zinc-300 text-xl">%</span>
                            </div>
                         </div>
                       ))}
                       <div className="p-8 border border-black/5 rounded-[3rem] bg-zinc-50 flex flex-col items-center justify-center gap-3 text-center">
                          <BellRing className="w-8 h-8 text-black/5" />
                          <p className="text-[9px] font-black text-zinc-200 uppercase tracking-widest">Security Update Required for<br/>Additional Campaign slots</p>
                       </div>
                    </div>
                  </div>
                )}

                <div className="pt-10 mt-10 border-t border-black/5 flex items-center gap-2 text-zinc-200 text-[9px] font-black uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 rounded-full bg-black/10" />
                   Protocol Change Authorization: Verified
                </div>
              </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
