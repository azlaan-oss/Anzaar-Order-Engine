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

  const s = {
    label: { fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', margin: '0 0 6px', display: 'block' },
    divider: { borderTop: '1px solid #f0f0f0', margin: 0 },
    row: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
    numLabel: { fontSize: '11px', fontWeight: 800, color: '#a1a1aa', minWidth: '24px', paddingTop: '2px' },
    bodyText: { fontSize: '13.5px', fontWeight: 500, color: '#3f3f46', lineHeight: 1.75, margin: 0 },
  };

  return (
    <div
      ref={ref}
      style={{
        width: '800px',
        background: '#ffffff',
        color: '#0a0a0a',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        padding: '64px 72px',
        boxSizing: 'border-box',
      }}
    >

      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        {settings?.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Brand Logo"
            crossOrigin="anonymous"
            style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'brightness(0)', display: 'block', margin: '0 auto 14px' }}
          />
        ) : (
          <p style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', margin: '0 0 14px', color: '#0a0a0a' }}>
            {settings?.brandName || 'ANZAAR'}
          </p>
        )}
        <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a1a1aa', margin: 0, fontWeight: 600 }}>
          Official Invoice
        </p>
      </div>

      {/* ── CLIENT + INVOICE META ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', paddingBottom: '36px', borderBottom: '1px solid #e4e4e7', marginBottom: '36px' }}>
        {/* Left: Client */}
        <div>
          <span style={s.label}>Billed To</span>
          <p style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.1, color: '#0a0a0a' }}>{customer.name}</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#71717a', margin: '0 0 14px' }}>{customer.phone}</p>
          <p style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.9, margin: 0 }}>
            {customer.address}
          </p>
        </div>

        {/* Right: Invoice Meta */}
        <div style={{ textAlign: 'right' }}>
          <span style={s.label}>Invoice No.</span>
          <p style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 22px', color: '#0a0a0a' }}>#{order.orderId}</p>
          <span style={s.label}>Date</span>
          <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 22px', color: '#3f3f46' }}>{date}</p>
          <div style={{ display: 'inline-block', padding: '5px 14px', border: '1.5px solid #0a0a0a', borderRadius: '4px' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>✓ Order Confirmed</p>
          </div>
        </div>
      </div>

      {/* ── LINE ITEMS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...s.label, textAlign: 'left', paddingBottom: '12px', fontWeight: 700 }}>Product</th>
            <th style={{ ...s.label, textAlign: 'center', paddingBottom: '12px', width: '56px' }}>Qty</th>
            <th style={{ ...s.label, textAlign: 'right', paddingBottom: '12px' }}>Amount</th>
          </tr>
          <tr><td colSpan={3} style={{ padding: 0 }}><hr style={s.divider} /></td></tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '20px 0', verticalAlign: 'top' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px', color: '#0a0a0a' }}>
                  {item.name}
                </p>
                <p style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
                  {item.color} · {item.size} · {item.sku}
                </p>
              </td>
              <td style={{ padding: '20px 0', textAlign: 'center', fontSize: '15px', fontWeight: 800, verticalAlign: 'top' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '20px 0', textAlign: 'right', fontSize: '16px', fontWeight: 800, verticalAlign: 'top' }}>
                ৳{item.price.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── FINANCIAL SUMMARY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '12px', paddingTop: '32px', borderTop: '2px solid #0a0a0a' }}>

        {/* Left: Message + breakdown */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#52525b', lineHeight: 1.85, margin: '0 0 28px' }}>
            আপনার অর্ডারটি সফলভাবে কনফার্ম হয়েছে। আঞ্জার বেছে নেওয়ার জন্য আন্তরিক ধন্যবাদ।
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa' }}>Subtotal</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>৳{totals.subtotal.toLocaleString()}</span>
            </div>
            {totals.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa' }}>Discount</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>–৳{totals.discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa' }}>Delivery</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>৳{totals.delivery.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#3f3f46' }}>৳{totals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Due at delivery — THE focal point */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ ...s.label, display: 'block', marginBottom: '10px' }}>
            ডেলিভারিতে প্রদেয় · Due at Delivery
          </span>
          <p style={{ fontSize: '58px', fontWeight: 900, margin: 0, lineHeight: 1, color: '#0a0a0a', letterSpacing: '-0.03em' }}>
            ৳{totals.due.toLocaleString()}
          </p>
          {totals.paid > 0 && (
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', margin: '12px 0 0' }}>
              আগাম পরিশোধিত: ৳{totals.paid.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────── */}
      {/* ── GUIDELINES ── full-width, after a rule ── */}
      {/* ─────────────────────────────────────────── */}
      <div style={{ marginTop: '56px' }}>
        <hr style={{ border: 'none', borderTop: '3px solid #0a0a0a', margin: '0 0 44px' }} />

        {/* Title */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#a1a1aa', margin: '0 0 6px' }}>
            Important
          </p>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.01em', color: '#0a0a0a' }}>
            আপনার জন্য জরুরি নির্দেশনা
          </p>
        </div>

        {/* Section A: Product */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0', margin: '0 0 20px' }}>
            পণ্য গ্রহণ
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div style={s.row}>
              <span style={s.numLabel}>০১</span>
              <p style={s.bodyText}>ক্যামেরার রেজোলিউশন ও আলোর তারতম্যে পণ্যের রঙ সামান্য আলাদা দেখাতে পারে — এটি সম্পূর্ণ স্বাভাবিক।</p>
            </div>

            <div style={{ ...s.row, background: '#f0fdf4', padding: '14px 18px', borderLeft: '3px solid #16a34a', borderRadius: '0 6px 6px 0' }}>
              <span style={{ ...s.numLabel, color: '#16a34a' }}>০২</span>
              <p style={{ ...s.bodyText, fontWeight: 700, color: '#14532d' }}>
                পার্সেল খোলার আগে অবশ্যই একটি <strong>আনপ্যাকিং ভিডিও</strong> রেকর্ড করুন। এটি আপনার স্বার্থ রক্ষা করে।
              </p>
            </div>

            <div style={s.row}>
              <span style={s.numLabel}>০৩</span>
              <p style={s.bodyText}>পণ্যে সমস্যা থাকলে ভিডিও পাঠানোর পর আমরা নিজ দায়িত্বে নতুন পণ্য পৌঁছে দেবো, ইনশাআল্লাহ।</p>
            </div>

            <div style={{ ...s.row, background: '#fff1f2', padding: '14px 18px', borderLeft: '3px solid #dc2626', borderRadius: '0 6px 6px 0' }}>
              <span style={{ ...s.numLabel, color: '#dc2626' }}>০৪</span>
              <p style={{ ...s.bodyText, fontWeight: 700, color: '#7f1d1d' }}>
                আনপ্যাকিং ভিডিও না থাকলে কোনো ক্লেইম গ্রহণযোগ্য হবে না। সমস্যা হলে ডেলিভারি ম্যানের কাছেই তাৎক্ষণিক রিটার্ন করুন ও আমাদের জানান।
              </p>
            </div>

          </div>
        </div>

        {/* Section B: Exchange */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0', margin: '0 0 20px' }}>
            এক্সচেঞ্জ পলিসি
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'সাইজ বা কালার পরিবর্তনের ক্ষেত্রে ডেলিভারি ম্যান থাকাকালীন ডেলিভারি চার্জ পরিশোধ করে সাথে সাথে পণ্য ফিরিয়ে দিন।',
              'পণ্য পাওয়ার পর এক্সচেঞ্জ করতে চাইলে সর্বোচ্চ ৩ দিনের মধ্যে আমাদের নিশ্চিত করুন।',
              'কাস্টমাইজ সাইজ, ব্যবহারকৃত পণ্য এবং ডিসকাউন্টে কেনা পণ্যে এক্সচেঞ্জ বা রিফান্ড প্রযোজ্য নয়।',
              'অনলাইনে এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি এবং রিটার্ন চার্জ গ্রাহককে বহন করতে হবে। এক্সচেঞ্জ মাত্র একবারই করা যাবে।',
            ].map((text, i) => (
              <div key={i} style={s.row}>
                <span style={s.numLabel}>0{i + 1}</span>
                <p style={s.bodyText}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4d4d8', margin: 0 }}>
            {settings?.brandName || 'Anzaar'} · Electronic Invoice · No Physical Signature Required
          </p>
        </div>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
