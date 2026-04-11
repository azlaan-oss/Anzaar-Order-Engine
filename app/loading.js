"use client";

import React from 'react';

export default function RootLoading() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-10 animate-pulse">
      
      {/* KPI Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-7 rounded-[3rem] border border-black/5 shadow-sm space-y-4">
             <div className="w-12 h-12 bg-zinc-50 rounded-2xl" />
             <div className="space-y-2">
                <div className="h-2 bg-zinc-100 rounded-full w-1/3" />
                <div className="h-6 bg-zinc-50 rounded-xl w-3/4" />
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart Shell */}
        <div className="xl:col-span-2 bg-white p-10 rounded-[4rem] border border-black/5 shadow-sm space-y-8 min-h-[450px]">
           <div className="h-10 bg-zinc-100 rounded-2xl w-1/4" />
           <div className="flex-1 bg-zinc-50 rounded-[2.5rem] w-full h-[300px]" />
        </div>

        {/* Radar/Circle Chart Shell */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-black/5 space-y-8 h-full min-h-[450px]">
           <div className="h-6 bg-zinc-50 rounded-full w-1/2" />
           <div className="flex items-center justify-center pt-10">
              <div className="w-48 h-48 rounded-full border-8 border-zinc-50" />
           </div>
        </div>
      </div>

      {/* Recent Activity Table Shell */}
      <div className="bg-white rounded-[3.5rem] p-10 border border-black/5 shadow-sm space-y-8">
         <div className="h-8 bg-zinc-100 rounded-2xl w-48" />
         <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
               <div key={i} className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3">
                     <div className="h-4 bg-zinc-50 rounded-md w-1/4" />
                     <div className="h-3 bg-zinc-50 rounded-md w-1/2 opacity-50" />
                  </div>
                  <div className="w-24 h-8 bg-zinc-50 rounded-2xl" />
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
