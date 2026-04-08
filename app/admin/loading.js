"use client";

import React from 'react';

export default function Loading() {
  return (
    <div className="w-full h-full flex flex-col gap-6 animate-pulse">
      <div className="h-20 bg-emerald-950/5 rounded-3xl w-full" />
      <div className="flex-1 bg-white/40 rounded-[3rem] p-10 space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-100 rounded-md w-1/4" />
              <div className="h-4 bg-gray-100 rounded-md w-1/2" />
            </div>
            <div className="w-24 h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
