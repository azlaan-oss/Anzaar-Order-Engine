"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function PerformanceAnalytics({ data, title, height = 200 }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const width = 1000;
  const padding = 40;
  
  const points = data.map((d, i) => ({
    x: padding + (i * (width - 2 * padding) / (data.length - 1 || 1)),
    y: height - padding - (d.value / maxVal * (height - 2 * padding))
  }));

  const linePath = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-xl shadow-emerald-950/5 space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-black text-emerald-950 uppercase tracking-[0.2em]">{title}</h3>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Vector</span>
         </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line 
              key={i}
              x1={padding} 
              x2={width - padding} 
              y1={padding + p * (height - 2 * padding)} 
              y2={padding + p * (height - 2 * padding)} 
              stroke="#F3F4F6" 
              strokeWidth="1" 
            />
          ))}

          {/* Area Fill */}
          <motion.path 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            d={areaPath} 
            fill="url(#gradient)" 
          />

          {/* Line */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={linePath} 
            fill="none" 
            stroke="#064e3b" 
            strokeWidth="4" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <motion.circle 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.05 }}
              cx={p.x} 
              cy={p.y} 
              r="6" 
              fill="#064e3b" 
              stroke="white" 
              strokeWidth="3" 
            />
          ))}

          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex justify-between px-2">
         {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
            <span key={i} className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
              {d.label}
            </span>
         ))}
      </div>
    </div>
  );
}
