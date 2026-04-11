import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const InvoiceTemplate = React.forwardRef(({ order }, ref) => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) setSettings(snap.data());
      } catch (err) {
        console.error("Settings fetch error:", err);
      }
    };
    fetchSettings();
  }, []);

  if (!order) return null;

  const { customer, items, totals, timestamp } = order;
  const date = new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const labelLeft = { fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a', margin: '0 0 6px', display: 'block' };
  const labelRight = { fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a', margin: '0 0 6px', display: 'block' };

  return (
    <div
      ref={ref}
      style={{
        width: '800px',
        background: '#ffffff',
        color: '#09090b',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        padding: '50px 60px',
        boxSizing: 'border-box',
      }}
    >

      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        {settings?.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Brand Logo"
            crossOrigin="anonymous"
            style={{
              height: '50px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0)',
              display: 'block',
              margin: '0 auto 12px',
            }}
          />
        ) : (
          <p style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', margin: '0 0 10px', color: '#09090b' }}>
            {settings?.brandName || 'ANZAAR'}
          </p>
        )}
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a', margin: 0, fontWeight: 700 }}>
          Official Invoice
        </p>
      </div>

      {/* ── ALIGNED CLIENT + INVOICE META ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', paddingBottom: '20px', borderBottom: '2px solid #e4e4e7' }}>
        {/* Left column */}
        <div>
          <span style={labelLeft}>Billed To</span>
          <p style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2, color: '#09090b' }}>{customer.name}</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#27272a', margin: '0 0 8px' }}>{customer.phone}</p>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.6, margin: 0 }}>
            {customer.address}
          </p>
        </div>
        
        {/* Right column */}
        <div style={{ textAlign: 'right' }}>
          <span style={labelRight}>Invoice No.</span>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 16px', color: '#09090b' }}>#{order.orderId}</p>

          <span style={labelRight}>Date</span>
          <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#27272a' }}>{date}</p>
        </div>
      </div>

      {/* ── ORDER CONFIRMED STATUS ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', background: '#09090b', color: '#ffffff',
          padding: '6px 16px', borderRadius: '40px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>✓ Order Confirmed</span>
        </div>
      </div>

      {/* ── COMPACT PRODUCT TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr>
            <th style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#a1a1aa', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '8px', borderBottom: '1px solid #e4e4e7' }}>Item Details</th>
            <th style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#a1a1aa', textTransform: 'uppercase', textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid #e4e4e7', width: '60px' }}>Qty</th>
            <th style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#a1a1aa', textTransform: 'uppercase', textAlign: 'right', paddingBottom: '8px', borderBottom: '1px solid #e4e4e7', width: '100px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '16px 0', verticalAlign: 'middle', borderBottom: '1px solid #f4f4f5' }}>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#09090b', margin: '0 0 6px' }}>{item.name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px' }}>Color: {item.color}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px' }}>Size: {item.size}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#52525b', textTransform: 'uppercase', background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px' }}>SKU: {item.sku}</span>
                </div>
              </td>
              <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#09090b', borderBottom: '1px solid #f4f4f5' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '18px', fontWeight: 900, color: '#09090b', borderBottom: '1px solid #f4f4f5' }}>
                ৳{item.price.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── FINANCIAL TOTALS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#71717a' }}>Subtotal</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#3f3f46' }}>৳{totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#71717a' }}>Discount</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#3f3f46' }}>–৳{totals.discount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#71717a' }}>Delivery</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#3f3f46' }}>৳{totals.delivery.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e4e4e7' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#09090b', textTransform: 'uppercase' }}>Grand Total</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#09090b' }}>৳{totals.total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', background: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #e4e4e7' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            ডেলিভারিতে প্রদেয় (Due)
          </span>
          <p style={{ fontSize: '48px', fontWeight: 900, margin: 0, color: '#09090b', lineHeight: 1 }}>
            ৳{totals.due.toLocaleString()}
          </p>
          {totals.paid > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', margin: '8px 0 0' }}>
              আগাম পরিশোধিত: ৳{totals.paid.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ── CELEBRATION BANNER ── */}
      <div style={{
        marginTop: '24px', padding: '20px', borderRadius: '12px', textAlign: 'center',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '1px solid #bbf7d0', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.05)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: '0 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🎉</span> আপনার অর্ডারটি সফলভাবে কনফার্ম হয়েছে!
        </h3>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#166534', margin: 0 }}>
          আঞ্জার বেছে নেওয়ার জন্য আপনাকে আন্তরিক ধন্যবাদ। আপনার পার্সেলটি দ্রুততম সময়ে আপনার কাছে পৌঁছে দিতে আমরা কাজ করছি।
        </p>
      </div>

      {/* ── CREATIVE & ENGAGING IMPORTANT NOTES (MODERN SMOOTH DARK THEME) ── */}
      <div style={{ marginTop: '40px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #09090b 0%, #1a1a1f 100%)', 
          borderRadius: '16px', padding: '24px 32px', color: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: '1px solid #27272a'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>👀</span>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px', 
                background: 'linear-gradient(90deg, #ffffff, #a1a1aa)', 
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                একটু সময় দিন!
              </h2>
              <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, fontWeight: 500 }}>
                শপিং শেষে অনেকেই এই অংশটি এড়িয়ে যান, কিন্তু আনুষঙ্গিক সুরক্ষার জন্য এই তথ্যগুলো জানা খুবই জরুরি।
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. Unpacking Video Hero Card - Smooth Neon Green Glass */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(21, 128, 61, 0.05) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center',
              boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.05)'
            }}>
              <span style={{ fontSize: '42px', lineHeight: 1, filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4))' }}>📦🎥</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: '#4ade80' }}>
                  যেটি সবচেয়ে বেশি জরুরি: আনপ্যাকিং ভিডিও
                </h3>
                <p style={{ fontSize: '13.5px', color: '#d1fae5', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                  পার্সেলটি খোলার আগে অবশ্যই মোবাইলে ভিডিও চালু করুন। এটি আপনার সুরক্ষা! আনপ্যাকিং ভিডিও ছাড়া আমরা কোনো ত্রুটি বা ক্লেইম প্রমাণ করতে পারবো না।
                </p>
              </div>
            </div>

            {/* 2 Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* Color Variance Creative Box - Smooth Dark Glass */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)', 
                borderRadius: '12px', padding: '16px', 
                border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' 
              }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎨</span>
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 6px', color: '#e4e4e7' }}>রঙের তারতম্য</h3>
                <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: '0 0 12px', lineHeight: 1.5, fontWeight: 500, flexGrow: 1 }}>
                  ক্যামেরা ও লাইটিং এর কারণে বাস্তবে রঙের উজ্জ্বলতা একটু ভিন্ন দেখাতে পারে, যা স্বাভাবিক নিয়ম।
                </p>
                {/* Advanced visual representation of color variance */}
                <div style={{
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(90deg, #3f2b1c 0%, #b8865c 50%, #e0c8b6 100%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 8px',
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)'
                }}>
                   <span style={{ fontSize: '9px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em', opacity: 0.8 }}>Low Light</span>
                   <span style={{ fontSize: '9px', fontWeight: 800, color: '#44403c', letterSpacing: '0.05em' }}>Bright Light</span>
                </div>
              </div>

              {/* Exchange Policy - Smooth Dark Glass */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)', 
                borderRadius: '12px', padding: '16px', 
                border: '1px solid rgba(255, 255, 255, 0.05)' 
              }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔁</span>
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 6px', color: '#e4e4e7' }}>এক্সচেঞ্জ সুবিধা</h3>
                <p style={{ fontSize: '12.5px', color: '#a1a1aa', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  ফিটিংস বা অন্য কোনো ইস্যুতে এক্সচেঞ্জ করতে চাইলে, ডেলিভারি ম্যান থাকাকালীন চার্জ দিয়ে ফেরৎ দিন অথবা ৩ দিনের মধ্যে আমাদের জানান।
                </p>
              </div>
            </div>

            {/* 3. Negative Case Warning - Smooth Red Glow */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(153, 27, 27, 0.05) 100%)', 
              borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.05)'
            }}>
              <span style={{ fontSize: '28px', lineHeight: 1, filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}>🚫</span>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 4px', color: '#fca5a5' }}>
                  যেসব ক্ষেত্রে এক্সচেঞ্জ হবে না
                </h3>
                <p style={{ fontSize: '12.5px', color: '#fecaca', margin: 0, fontWeight: 500, lineHeight: 1.5, opacity: 0.9 }}>
                  কাস্টমাইজড সাইজ, ডিসকাউন্ট পণ্য বা ব্যবহার করা পণ্যের ক্ষেত্রে কোনো প্রকার রিটার্ন, রিফান্ড বা এক্সচেঞ্জ প্রযোজ্য হবে না।
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', margin: 0 }}>
          {settings?.brandName || 'Anzaar'} · Electronic Invoice · No Physical Signature Required
        </p>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
