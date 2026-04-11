"use client";

import React from 'react';

export default function ProductsLoading() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-10 px-6 animate-pulse">
      
      {/* Header Skeleton */}
      <div className="relative mt-8 bg-emerald-950 rounded-[3.5rem] overflow-hidden border border-emerald-900/50 p-10 md:p-14 flex flex-col xl:flex-row items-center justify-between gap-12 opacity-90">
        <div className="space-y-4 flex flex-col items-center xl:items-start text-center xl:text-left flex-1">
           <div className="h-6 bg-white/10 rounded-full w-32" />
           <div className="h-14 bg-white/20 rounded-2xl w-3/4" />
           <div className="h-4 bg-white/5 rounded-full w-48" />
           <div className="flex gap-4 pt-4">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="w-10 h-10 rounded-full bg-white/10" />
           </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full xl:max-w-2xl">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] h-32" />
           ))}
        </div>

        <div className="flex flex-col gap-4 w-full md:w-80">
           <div className="h-12 bg-white/10 rounded-2xl w-full" />
           <div className="h-16 bg-white/20 rounded-[2rem] w-full" />
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
            <div className="aspect-[4/5] bg-gray-50" />
            <div className="p-6 space-y-4 flex-1 flex flex-col">
               <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-5 bg-gray-100 rounded-lg w-1/4" />
               </div>
               <div className="h-3 bg-gray-50 rounded-full w-3/4" />
               <div className="flex-1 flex flex-col justify-end gap-3 pt-4">
                  <div className="flex gap-2">
                     <div className="w-8 h-8 rounded-full bg-gray-50" />
                     <div className="w-8 h-8 rounded-full bg-gray-50" />
                  </div>
                  <div className="h-4 bg-gray-50 rounded-full w-1/4" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
