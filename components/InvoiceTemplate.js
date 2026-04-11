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
        color: '#1c1917',
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
          <p style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', margin: '0 0 10px', color: '#1c1917' }}>
            {settings?.brandName || 'ANZAAR'}
          </p>
        )}
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#78716c', margin: 0, fontWeight: 700 }}>
          Official Invoice
        </p>
      </div>

      {/* ── ALIGNED CLIENT + INVOICE META ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', paddingBottom: '20px', borderBottom: '2px solid #e7e5e4' }}>
        {/* Left column */}
        <div>
          <span style={labelLeft}>Billed To</span>
          <p style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2, color: '#1c1917' }}>{customer.name}</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#44403c', margin: '0 0 8px' }}>{customer.phone}</p>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.6, margin: 0 }}>
            {customer.address}
          </p>
        </div>
        
        {/* Right column */}
        <div style={{ textAlign: 'right' }}>
          <span style={labelRight}>Invoice No.</span>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 16px', color: '#1c1917' }}>#{order.orderId}</p>

          <span style={labelRight}>Date</span>
          <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#44403c' }}>{date}</p>
        </div>
      </div>

      {/* ── ORDER CONFIRMED STATUS ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', background: '#1c1917', color: '#ffffff',
          padding: '6px 16px', borderRadius: '2px', // Sharper corners for a classier look
        }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>✓ Order Confirmed</span>
        </div>
      </div>

      {/* ── COMPACT PRODUCT TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr>
            <th style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#a8a29e', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '8px', borderBottom: '1px solid #e7e5e4' }}>Item Details</th>
            <th style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#a8a29e', textTransform: 'uppercase', textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid #e7e5e4', width: '60px' }}>Qty</th>
            <th style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: '#a8a29e', textTransform: 'uppercase', textAlign: 'right', paddingBottom: '8px', borderBottom: '1px solid #e7e5e4', width: '100px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '16px 0', verticalAlign: 'middle', borderBottom: '1px solid #f5f5f4' }}>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', margin: '0 0 6px' }}>{item.name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', background: '#f5f5f4', padding: '2px 6px', borderRadius: '2px' }}>Color: {item.color}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', background: '#f5f5f4', padding: '2px 6px', borderRadius: '2px' }}>Size: {item.size}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#57534e', textTransform: 'uppercase', background: '#f5f5f4', padding: '2px 6px', borderRadius: '2px' }}>SKU: {item.sku}</span>
                </div>
              </td>
              <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#1c1917', borderBottom: '1px solid #f5f5f4' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '18px', fontWeight: 900, color: '#1c1917', borderBottom: '1px solid #f5f5f4' }}>
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
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716c' }}>Subtotal</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#44403c' }}>৳{totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716c' }}>Discount</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#44403c' }}>–৳{totals.discount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716c' }}>Delivery</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#44403c' }}>৳{totals.delivery.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e7e5e4' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#1c1917', textTransform: 'uppercase' }}>Grand Total</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#1c1917' }}>৳{totals.total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right', background: '#fafaf9', padding: '16px', borderRadius: '4px', border: '1px solid #e7e5e4' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            ডেলিভারিতে প্রদেয় (Due)
          </span>
          <p style={{ fontSize: '48px', fontWeight: 900, margin: 0, color: '#1c1917', lineHeight: 1 }}>
            ৳{totals.due.toLocaleString()}
          </p>
          {totals.paid > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#57534e', margin: '8px 0 0' }}>
              আগাম পরিশোধিত: ৳{totals.paid.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ── CELEBRATION BANNER (PREMIUM UNDERSTATED) ── */}
      <div style={{
        marginTop: '32px', padding: '24px', textAlign: 'center',
        borderTop: '1px solid #e7e5e4', borderBottom: '1px solid #e7e5e4'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', margin: '0 0 8px', letterSpacing: '0.02em' }}>
          আপনার অর্ডারটি সফলভাবে কনফার্ম হয়েছে।
        </h3>
        <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#57534e', margin: 0, lineHeight: 1.6 }}>
          আঞ্জার-এর এক্সক্লুসিভ কালেকশন বেছে নেওয়ার জন্য আপনাকে আন্তরিক ধন্যবাদ। আপনার পার্সেলটি অত্যন্ত যত্ন সহকারে প্রস্তুত করে দ্রুততম সময়ে আপনার কাছে পৌঁছে দেওয়া হবে।
        </p>
      </div>

      {/* ── CREATIVE & ENGAGING IMPORTANT NOTES (PREMIUM EDITORIAL THEME) ── */}
      <div style={{ marginTop: '50px' }}>
        <div style={{
          background: '#faf9f6', // Elegant cream/off-white background
          padding: '40px',
          border: '1px solid #e6e4df',
        }}>
          {/* Section Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#a39b8e', display: 'block', marginBottom: '8px' }}>
              Essential Guidelines
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 16px', color: '#1c1917', letterSpacing: '-0.02em' }}>
              আপনার শপিং অভিজ্ঞতা সুন্দর করতে কিছু জরুরি নিয়ম
            </h2>
            <div style={{ width: '40px', height: '2px', background: '#d6d3d1', margin: '0 auto' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* 1. Unpacking Video Hero Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e6e4df',
              padding: '24px 32px', display: 'flex', gap: '24px', alignItems: 'center',
            }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '50%', background: '#f5f5f4', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px', color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  প্রাইমারি রিকয়ারমেন্ট: আনপ্যাকিং ভিডিও
                </h3>
                <p style={{ fontSize: '13.5px', color: '#57534e', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                  পার্সেলটি খোলার সময় অবশ্যই ভিডিও রেকর্ড করুন। এটি আপনার এবং আমাদের—উভয়ের জন্যই সবচেয়ে বড় প্রমাণ ও সুরক্ষা। স্বচ্ছতার স্বার্থে, আনপ্যাকিং ভিডিও ছাড়া কোনো ক্লেইম গ্রহণযোগ্য হবে না।
                </p>
              </div>
            </div>

            {/* 2 Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              
              {/* Color Variance Creative Box */}
              <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e6e4df', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 8px', color: '#1c1917' }}>রঙের তারতম্য (Color Variance)</h3>
                <p style={{ fontSize: '12.5px', color: '#57534e', margin: '0 0 16px', lineHeight: 1.6, fontWeight: 500, flexGrow: 1 }}>
                  স্ক্রিনের ব্রাইটনেস এবং পারিপার্শ্বিক আলোর কারণে বাস্তবে কাপড়ের রং কিছুটা লাইট বা ডিপ দেখাতে পারে, যা স্বাভাবিক নিয়ম।
                </p>
                {/* Advanced visual representation of color variance */}
                <div style={{
                  height: '28px',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #d4cfc5 0%, #b8af9f 50%, #958a74 100%)', // Elegant taupe color shifting gradient
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 12px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}>
                   <span style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff', letterSpacing: '0.05em', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Shadow</span>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity: 0.8}}>
                     <circle cx="12" cy="12" r="5"></circle>
                     <line x1="12" y1="1" x2="12" y2="3"></line>
                     <line x1="12" y1="21" x2="12" y2="23"></line>
                     <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                     <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                     <line x1="1" y1="12" x2="3" y2="12"></line>
                     <line x1="21" y1="12" x2="23" y2="12"></line>
                     <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                     <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                   </svg>
                   <span style={{ fontSize: '10px', fontWeight: 600, color: '#44403c', letterSpacing: '0.05em' }}>Bright Light</span>
                </div>
              </div>

              {/* Exchange Policy */}
              <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e6e4df' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#1c1917' }}>এক্সচেঞ্জ সুবিধা</h3>
                </div>
                <p style={{ fontSize: '12.5px', color: '#57534e', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
                  ফিটিংস বা অন্য কোনো ইস্যুতে এক্সচেঞ্জ করতে চাইলে, ডেলিভারি ম্যান থাকাকালীন ডেলিভারি চার্জ দিয়ে রিটার্ন দিন। পরবর্তীতে এক্সচেঞ্জ করতে <strong>৩ দিনের মধ্যে</strong> আমাদের অবহিত করুন।
                </p>
              </div>
            </div>

            {/* 3. Exceptions */}
            <div style={{
              background: '#ffffff', padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center',
              border: '1px solid #e6e4df', borderLeft: '3px solid #1c1917'
            }}>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, margin: '0 0 4px', color: '#1c1917' }}>
                  যেসব ক্ষেত্রে এক্সচেঞ্জ প্রযোজ্য নয়
                </h3>
                <p style={{ fontSize: '12.5px', color: '#57534e', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                  কাস্টমাইজড বা স্পেশাল সাইজ, ডিসকাউন্ট পণ্য বা ব্যবহার করা পণ্যের ক্ষেত্রে কোনো প্রকার রিটার্ন, রিফান্ড বা এক্সচেঞ্জ পলিসি প্রযোজ্য নয়।
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
