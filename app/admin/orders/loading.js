"use client";

import React from 'react';

export default function OrdersLoading() {
  return (
    <div className="w-full h-full flex flex-col gap-6 animate-pulse p-4 md:p-0">
      
      {/* Search & Filter Header Skeleton */}
      <div className="flex flex-col gap-4 mt-6 md:mt-0">
         <div className="bg-emerald-950/20 h-10 rounded-xl w-full" />
         <div className="flex gap-4">
            <div className="h-10 bg-gray-100 rounded-xl flex-1" />
            <div className="h-10 bg-gray-100 rounded-xl w-24" />
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="h-10 bg-gray-100 rounded-xl w-full md:w-96" />
         <div className="h-4 bg-gray-100 rounded-full w-32 hidden md:block" />
      </div>

      {/* Table Shell Skeleton */}
      <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[3rem] shadow-2xl border border-white/60 overflow-hidden relative flex flex-col">
        <div className="hidden md:block">
           <div className="h-16 bg-white/90 border-b border-gray-50 flex items-center px-10 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded-full flex-1" />
              ))}
           </div>
        </div>
        
        <div className="p-8 space-y-8">
           {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-10">
                 <div className="w-6 h-6 bg-gray-100 rounded-md" />
                 <div className="w-20 h-4 bg-gray-100 rounded-full" />
                 <div className="flex-1 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                       <div className="h-4 bg-gray-100 rounded-md w-1/3" />
                       <div className="h-3 bg-gray-100 rounded-md w-1/2 opacity-50" />
                    </div>
                 </div>
                 <div className="w-24 h-8 bg-gray-100 rounded-2xl" />
                 <div className="w-20 h-4 bg-gray-100 rounded-full" />
                 <div className="w-10 h-10 bg-gray-100 rounded-2xl" />
              </div>
           ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-auto py-4 flex items-center justify-between">
         <div className="h-4 bg-gray-100 rounded-full w-24" />
         <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-10 h-8 bg-gray-100 rounded-lg" />
            ))}
         </div>
      </div>
    </div>
  );
}
