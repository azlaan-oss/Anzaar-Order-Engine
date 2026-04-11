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

  const label = {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#71717a',
    margin: '0 0 6px',
    display: 'block',
  };

  const bodyText = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#18181b',
    lineHeight: 1.8,
    margin: 0,
  };

  const numBadge = {
    fontSize: '11px',
    fontWeight: 800,
    color: '#71717a',
    minWidth: '24px',
    paddingTop: '3px',
    flexShrink: 0,
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
            style={{
              height: '54px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0)',
              display: 'block',
              margin: '0 auto 16px',
            }}
          />
        ) : (
          <p style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', margin: '0 0 14px', color: '#0a0a0a' }}>
            {settings?.brandName || 'ANZAAR'}
          </p>
        )}
        <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#71717a', margin: 0, fontWeight: 700 }}>
          Official Invoice
        </p>
      </div>

      {/* ── CLIENT + INVOICE META ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        paddingBottom: '36px',
        borderBottom: '1px solid #d4d4d8',
        marginBottom: '36px',
      }}>
        {/* Left: Client */}
        <div>
          <span style={label}>Billed To</span>
          <p style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.1, color: '#0a0a0a' }}>{customer.name}</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#3f3f46', margin: '0 0 14px' }}>{customer.phone}</p>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.9, margin: 0 }}>
            {customer.address}
          </p>
        </div>

        {/* Right: Invoice Meta */}
        <div style={{ textAlign: 'right' }}>
          <span style={label}>Invoice No.</span>
          <p style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 20px', color: '#0a0a0a' }}>#{order.orderId}</p>

          <span style={label}>Date</span>
          <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 20px', color: '#18181b' }}>{date}</p>

          <div style={{ display: 'inline-block', padding: '6px 16px', border: '2px solid #0a0a0a', borderRadius: '4px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0, color: '#0a0a0a' }}>
              ✓ Order Confirmed
            </p>
          </div>
        </div>
      </div>

      {/* ── LINE ITEMS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...label, textAlign: 'left', paddingBottom: '12px' }}>Product</th>
            <th style={{ ...label, textAlign: 'center', paddingBottom: '12px', width: '60px' }}>Qty</th>
            <th style={{ ...label, textAlign: 'right', paddingBottom: '12px' }}>Amount</th>
          </tr>
          <tr><td colSpan={3}><div style={{ borderTop: '1px solid #d4d4d8', marginBottom: '4px' }} /></td></tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '20px 0', verticalAlign: 'top', borderBottom: '1px solid #f4f4f5' }}>
                <p style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 5px', color: '#0a0a0a' }}>
                  {item.name}
                </p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                  {item.color} · {item.size} · {item.sku}
                </p>
              </td>
              <td style={{ padding: '20px 0', textAlign: 'center', fontSize: '16px', fontWeight: 800, verticalAlign: 'top', color: '#0a0a0a', borderBottom: '1px solid #f4f4f5' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '20px 0', textAlign: 'right', fontSize: '17px', fontWeight: 800, verticalAlign: 'top', color: '#0a0a0a', borderBottom: '1px solid #f4f4f5' }}>
                ৳{item.price.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── FINANCIAL SUMMARY ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        marginTop: '16px',
        paddingTop: '32px',
        borderTop: '2.5px solid #0a0a0a',
      }}>

        {/* Left: Breakdown */}
        <div>
          <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#3f3f46', lineHeight: 1.9, margin: '0 0 28px' }}>
            আপনার অর্ডারটি সফলভাবে কনফার্ম হয়েছে। আঞ্জার বেছে নেওয়ার জন্য আন্তরিক ধন্যবাদ।
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a' }}>Subtotal</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#3f3f46' }}>৳{totals.subtotal.toLocaleString()}</span>
            </div>
            {totals.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a' }}>Discount</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#3f3f46' }}>–৳{totals.discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a' }}>Delivery</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#3f3f46' }}>৳{totals.delivery.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #d4d4d8' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0a0a0a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#0a0a0a' }}>৳{totals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Due — The Bold Focal Point */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ ...label, color: '#52525b', marginBottom: '10px' }}>
            ডেলিভারিতে প্রদেয় · Due at Delivery
          </span>
          <p style={{
            fontSize: '62px',
            fontWeight: 900,
            margin: 0,
            lineHeight: 1,
            color: '#0a0a0a',
            letterSpacing: '-0.03em',
          }}>
            ৳{totals.due.toLocaleString()}
          </p>
          {totals.paid > 0 && (
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', margin: '12px 0 0' }}>
              আগাম পরিশোধিত: ৳{totals.paid.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────── */}
      {/* ── GUIDELINES ── full-width, after a bold rule ─ */}
      {/* ─────────────────────────────────────────────── */}
      <div style={{ marginTop: '56px' }}>
        <div style={{ borderTop: '3px solid #0a0a0a', marginBottom: '44px' }} />

        {/* Title */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#71717a', margin: '0 0 8px' }}>
            Important · গুরুত্বপূর্ণ
          </p>
          <p style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: '#0a0a0a' }}>
            অর্ডার গ্রহণের আগে অনুগ্রহ করে পড়ুন
          </p>
        </div>

        {/* SECTION A: Product Receipt */}
        <div style={{ marginBottom: '36px' }}>
          <p style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#52525b', paddingBottom: '10px', borderBottom: '1.5px solid #e4e4e7', margin: '0 0 20px',
          }}>
            পণ্য গ্রহণ সংক্রান্ত
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* 01 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span style={numBadge}>০১</span>
              <p style={bodyText}>
                ক্যামেরার রেজোলিউশন ও আলোর ভিন্নতার কারণে পণ্যের রঙ ছবির তুলনায় সামান্য আলাদা দেখাতে পারে — এটি সম্পূর্ণ স্বাভাবিক এবং ফ্যাব্রিকের বৈশিষ্ট্য অনুযায়ী সামান্য লাইট বা ডিপ হতে পারে।
              </p>
            </div>

            {/* 02 — Green highlight: most important action */}
            <div style={{
              display: 'flex', gap: '18px', alignItems: 'flex-start',
              background: '#f0fdf4', padding: '16px 20px',
              borderLeft: '4px solid #16a34a', borderRadius: '0 6px 6px 0',
            }}>
              <span style={{ ...numBadge, color: '#16a34a', fontWeight: 900 }}>০২</span>
              <p style={{ ...bodyText, fontWeight: 700, color: '#14532d' }}>
                পার্সেলটি পাওয়ামাত্র খোলার আগে অবশ্যই একটি <strong>আনপ্যাকিং ভিডিও</strong> রেকর্ড করুন।
                এই ভিডিওটি আপনার সবচেয়ে বড় সুরক্ষা — কোনো সমস্যা হলে এটিই আপনার দাবির প্রমাণ হবে।
              </p>
            </div>

            {/* 03 */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span style={numBadge}>০৩</span>
              <p style={bodyText}>
                পণ্যে কোনো ভুল বা ত্রুটি থাকলে আনপ্যাকিং ভিডিওটি আমাদের পাঠান — আমরা যাচাই করে নিজ দায়িত্বে সঠিক পণ্যটি পৌঁছে দেবো, ইনশাআল্লাহ। আপনার ক্ষতি হয় এমন কিছু আমরা চাই না।
              </p>
            </div>

            {/* 04 — RED: critical warning */}
            <div style={{
              display: 'flex', gap: '18px', alignItems: 'flex-start',
              background: '#fff1f2', padding: '16px 20px',
              borderLeft: '4px solid #dc2626', borderRadius: '0 6px 6px 0',
            }}>
              <span style={{ ...numBadge, color: '#dc2626', fontWeight: 900 }}>০৪</span>
              <div>
                <p style={{ ...bodyText, fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                  ⚠ আনপ্যাকিং ভিডিও না থাকলে কোনো ক্লেইম গ্রহণযোগ্য হবে না।
                </p>
                <p style={{ ...bodyText, fontSize: '13px', color: '#7f1d1d', fontWeight: 500 }}>
                  পণ্যে সমস্যা দেখলে ডেলিভারি ম্যান চলে যাওয়ার আগেই তাঁকে ফিরিয়ে দিন এবং সাথে সাথে আমাদের ইনবক্সে জানান — আমরা সবসময় আপনার পাশে আছি।
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION B: Exchange Policy */}
        <div>
          <p style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#52525b', paddingBottom: '10px', borderBottom: '1.5px solid #e4e4e7', margin: '0 0 20px',
          }}>
            এক্সচেঞ্জ পলিসি
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span style={numBadge}>০১</span>
              <p style={bodyText}>
                সাইজ বা রঙ পরিবর্তন করতে চাইলে, ডেলিভারি ম্যান চলে যাওয়ার আগেই ডেলিভারি চার্জ পরিশোধ করে পণ্যটি তাৎক্ষণিক ফেরত দিন।
              </p>
            </div>

            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span style={numBadge}>০২</span>
              <p style={bodyText}>
                পণ্য রিসিভ করার পর অনলাইনে এক্সচেঞ্জ করতে চাইলে সাথে সাথে আমাদের জানান এবং সর্বোচ্চ <strong>৩ দিনের মধ্যে</strong> নিশ্চিত করুন।
              </p>
            </div>

            <div style={{
              display: 'flex', gap: '18px', alignItems: 'flex-start',
              background: '#fafafa', padding: '14px 18px',
              border: '1px dashed #d4d4d8', borderRadius: '6px',
            }}>
              <span style={{ ...numBadge, color: '#3f3f46' }}>০৩</span>
              <p style={{ ...bodyText, color: '#27272a', fontWeight: 600 }}>
                কাস্টমাইজ সাইজ, ব্যবহারকৃত পণ্য এবং ডিসকাউন্টে কেনা পণ্যের ক্ষেত্রে এক্সচেঞ্জ, রিটার্ন বা রিফান্ড প্রযোজ্য নয়। তবে পণ্যে আমাদের কোনো ত্রুটি থাকলে ইনশাআল্লাহ সমাধান করা হবে।
              </p>
            </div>

            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
              <span style={numBadge}>০৪</span>
              <p style={bodyText}>
                অনলাইনে এক্সচেঞ্জের ক্ষেত্রে ডেলিভারি এবং রিটার্ন চার্জ উভয়ই গ্রাহককে বহন করতে হবে। এক্সচেঞ্জ মাত্র <strong>একবারই</strong> করা যাবে এবং ব্যবহারকৃত পণ্য গ্রহণযোগ্য নয়।
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #e4e4e7', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', margin: 0 }}>
            {settings?.brandName || 'Anzaar'} · Electronic Invoice · No Physical Signature Required
          </p>
        </div>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
