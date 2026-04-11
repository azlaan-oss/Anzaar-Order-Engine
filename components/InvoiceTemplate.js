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

  const label = { fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a', margin: '0 0 6px', display: 'block' };

  return (
    <div ref={ref} style={{ width: '800px', background: '#ffffff', color: '#09090b', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", padding: '50px 60px', boxSizing: 'border-box' }}>

      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        {settings?.logoUrl ? (
          <img src={settings.logoUrl} alt="Brand Logo" crossOrigin="anonymous"
            style={{ height: '50px', width: 'auto', objectFit: 'contain', filter: 'brightness(0)', display: 'block', margin: '0 auto 12px' }} />
        ) : (
          <p style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', margin: '0 0 10px', color: '#09090b' }}>
            {settings?.brandName || 'ANZAAR'}
          </p>
        )}
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a', margin: 0, fontWeight: 700 }}>
          Official Invoice
        </p>
      </div>

      {/* ── CLIENT + META ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', paddingBottom: '20px', borderBottom: '2px solid #e4e4e7' }}>
        <div>
          <span style={label}>Billed To</span>
          <p style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2, color: '#09090b' }}>{customer.name}</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#27272a', margin: '0 0 8px' }}>{customer.phone}</p>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.6, margin: 0 }}>{customer.address}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={label}>Invoice No.</span>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 16px', color: '#09090b' }}>#{order.orderId}</p>
          <span style={label}>Date</span>
          <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#27272a' }}>{date}</p>
        </div>
      </div>

      {/* ── ORDER CONFIRMED BADGE ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#09090b', color: '#ffffff', padding: '6px 16px', borderRadius: '40px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>✓ Order Confirmed</span>
        </div>
      </div>

      {/* ── PRODUCT TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
              <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '16px', fontWeight: 900, color: '#09090b', borderBottom: '1px solid #f4f4f5' }}>{item.quantity}</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '18px', fontWeight: 900, color: '#09090b', borderBottom: '1px solid #f4f4f5' }}>৳{item.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTALS ── */}
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
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>ডেলিভারিতে প্রদেয় (Due)</span>
          <p style={{ fontSize: '48px', fontWeight: 900, margin: 0, color: '#09090b', lineHeight: 1 }}>৳{totals.due.toLocaleString()}</p>
          {totals.paid > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', margin: '8px 0 0' }}>আগাম পরিশোধিত: ৳{totals.paid.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* ── CELEBRATION BANNER ── */}
      <div style={{ marginTop: '24px', padding: '20px', borderRadius: '12px', textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: '0 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>🎉</span> আপনার অর্ডারটি সফলভাবে কনফার্ম হয়েছে!
        </h3>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#166534', margin: 0 }}>
          আঞ্জার বেছে নেওয়ার জন্য আপনাকে আন্তরিক ধন্যবাদ। আমরা আপনার পার্সেলটি দ্রুততম সময়ে পৌঁছে দিতে কাজ করছি।
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          ── CREATIVE IMPORTANT NOTES ──
      ══════════════════════════════════════════════════════ */}
      <div style={{ marginTop: '40px' }}>

        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#a1a1aa', margin: '0 0 6px' }}>Customer Guidelines</p>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#09090b', margin: 0 }}>আপনার শপিং অভিজ্ঞতা সুন্দর করতে কিছু জরুরি নিয়ম</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* ── CARD 1: Unpacking Video — Camera REC UI Style ── */}
          <div style={{ background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)', borderRadius: '14px', padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Camera REC mock UI */}
            <div style={{ flexShrink: 0, width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>📹</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                <span style={{ fontSize: '8px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.05em' }}>REC</span>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px', color: '#ffffff' }}>
                পার্সেল খোলার আগেই ভিডিও চালু করুন!
              </h3>
              <p style={{ fontSize: '13px', color: '#bbf7d0', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                আনপ্যাকিং ভিডিও আপনার সবচেয়ে বড় সুরক্ষা। পণ্যে কোনো সমস্যা থাকলে এই ভিডিওই একমাত্র প্রমাণ। ভিডিও ছাড়া কোনো ক্লেইম গ্রহণযোগ্য হবে না।
              </p>
            </div>
          </div>

          {/* ── CARD 2: Color Variance — Visual Side-by-Side Swatch Hack ── */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '20px 24px', border: '1px solid #e4e4e7' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ flexShrink: 0, flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px', color: '#09090b' }}>🎨 রঙের তারতম্য স্বাভাবিক</h3>
                <p style={{ fontSize: '12.5px', color: '#52525b', margin: 0, fontWeight: 500, lineHeight: 1.6 }}>
                  ক্যামেরার লাইটিং ও স্ক্রিনের ব্রাইটনেসের কারণে পণ্যের আসল রঙ একটু লাইট বা ডিপ দেখাতে পারে। এটি সম্পূর্ণ স্বাভাবিক।
                </p>
              </div>
              
              {/* ── VISUAL HACK: Side-by-side swatch comparison ── */}
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', margin: '0 0 8px' }}>উদাহরণ</p>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {/* Screen view swatch */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'linear-gradient(145deg, #f59e0b, #fbbf24)', border: '2px solid #e4e4e7', boxShadow: '0 0 0 3px rgba(251,191,36,0.2)' }}></div>
                    <p style={{ fontSize: '8px', fontWeight: 700, color: '#71717a', margin: '4px 0 0', lineHeight: 1.2 }}>📱 স্ক্রিনে</p>
                  </div>
                  {/* Arrow */}
                  <div style={{ fontSize: '14px', color: '#d4d4d8', marginBottom: '16px' }}>→</div>
                  {/* Real life swatch */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'linear-gradient(145deg, #b45309, #d97706)', border: '2px solid #e4e4e7' }}></div>
                    <p style={{ fontSize: '8px', fontWeight: 700, color: '#71717a', margin: '4px 0 0', lineHeight: 1.2 }}>☀️ বাস্তবে</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 3: Exchange — Step Timeline Style ── */}
          <div style={{ background: '#fafafa', borderRadius: '14px', padding: '20px 24px', border: '1px solid #e4e4e7' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 16px', color: '#09090b' }}>🔁 এক্সচেঞ্জ করতে চাইলে যা করবেন</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {/* Step 1 */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '18px' }}>📦</div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', margin: 0, lineHeight: 1.3 }}>পার্সেল পান</p>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#e4e4e7', flexShrink: 0 }}></div>
              {/* Step 2 */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '18px' }}>🤔</div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#854d0e', margin: 0, lineHeight: 1.3 }}>সমস্যা থাকলে</p>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#e4e4e7', flexShrink: 0 }}></div>
              {/* Step 3 */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '18px' }}>🛵</div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9d174d', margin: 0, lineHeight: 1.3 }}>ডেলিভারিম্যানকে ফেরৎ দিন</p>
              </div>
              <div style={{ width: '30px', height: '2px', background: '#e4e4e7', flexShrink: 0 }}></div>
              {/* Step 4 */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '18px' }}>✅</div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#14532d', margin: 0, lineHeight: 1.3 }}>৩ দিনের মধ্যে জানান</p>
              </div>
            </div>
          </div>

          {/* ── CARD 4: No Exchange — Strikethrough Visual Style ── */}
          <div style={{ background: '#fff7f7', borderRadius: '14px', padding: '18px 24px', border: '1px solid #fecaca', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '26px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>🚫</span>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 900, margin: '0 0 10px', color: '#7f1d1d' }}>যেসব পণ্যে এক্সচেঞ্জ হবে না</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  'কাস্টমাইজড বা স্পেশাল সাইজের পণ্য',
                  'ডিসকাউন্ট বা অফার মূল্যে কেনা পণ্য',
                  'একবার ব্যবহার করা হয়েছে এমন পণ্য',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 900 }}>✕</span>
                    <span style={{ fontSize: '12.5px', color: '#991b1b', fontWeight: 500, textDecoration: 'line-through', textDecorationColor: '#fca5a5', textDecorationThickness: '1.5px' }}>{item}</span>
                  </div>
                ))}
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
