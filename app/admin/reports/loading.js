"use client";

import React from 'react';

export default function ReportsLoading() {
  return (
    <div className="max-w-[2000px] mx-auto px-6 py-6 md:px-14 md:pt-0 md:pb-14 md:-mt-8 space-y-10 animate-pulse">
      
      {/* Header Skeleton */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="space-y-3 flex-1">
            <div className="h-12 bg-gray-100 rounded-2xl w-1/3" />
            <div className="h-6 bg-emerald-50 rounded-full w-48" />
        </div>
        <div className="h-14 bg-gray-50 rounded-[2rem] w-full xl:w-96" />
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-7 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col gap-5">
             <div className="w-12 h-12 bg-gray-50 rounded-2xl" />
             <div className="space-y-3">
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                <div className="h-8 bg-gray-50 rounded-xl w-3/4" />
                <div className="h-2 bg-gray-50 rounded-full w-1/3" />
             </div>
          </div>
        ))}
      </div>

      {/* Main Analysis Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 bg-white p-12 rounded-[4.5rem] border border-gray-200 shadow-sm space-y-10 min-h-[500px]">
           <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded-2xl w-1/4" />
              <div className="h-4 bg-gray-100 rounded-full w-1/2" />
           </div>
           <div className="h-full bg-emerald-900/5 rounded-[2.5rem] w-full" />
        </div>
        <div className="bg-emerald-950 p-10 rounded-[3.5rem] shadow-2xl h-full flex flex-col gap-8 opacity-40">
           <div className="h-6 bg-white/10 rounded-full w-1/2" />
           <div className="flex-1 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-white/5" />
           </div>
           <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded-full w-full" />
              <div className="h-4 bg-white/10 rounded-full w-3/4" />
           </div>
        </div>
      </div>
    </div>
  );
}
