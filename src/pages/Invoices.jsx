import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Eye, ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Additional charges state
  const [charges, setCharges] = useState({
    containerCharges: '',
    karachiLocalCharges: '',
    lahoreLocalCharges: '',
    laborCharges: '',
    godownCharges: '',
    otherCharges: '',
  });
  const [taxPercent, setTaxPercent] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_logs')
        .select(`
          id,
          bilty_id,
          receiver_name,
          receiver_phone,
          receiver_cnic,
          delivered_quantity,
          delivery_date,
          bilties (
            bilty_no,
            sender_name,
            sender_phone,
            total_amount,
            payment_status,
            from_city,
            to_city
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = (inv) => {
    setSelectedInvoice(inv);
    setCharges({ containerCharges: '', karachiLocalCharges: '', lahoreLocalCharges: '', laborCharges: '', godownCharges: '', otherCharges: '' });
    setTaxPercent('');
  };

  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
  };

  // Auto calculations
  const freight = Number(selectedInvoice?.bilties?.total_amount || 0);
  const totalAdditional = Object.values(charges).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const grossWithoutTax = freight + totalAdditional;
  const taxAmount = grossWithoutTax * (Number(taxPercent) || 0) / 100;
  const totalAmount = grossWithoutTax + taxAmount;

  const styles = {
    root: { padding: '2rem', minHeight: '100%', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)', background: 'var(--background)' },
    title: { fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' },
    subtitle: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' },
    card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' },
    th: { padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: '2px solid var(--border)', background: 'var(--surface)', whiteSpace: 'nowrap' },
    td: { padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
    viewBtn: { padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary-light)', color: 'var(--primary)', transition: 'background 0.2s' },
    badge: (status) => ({
      padding: '0.25rem 0.6rem',
      borderRadius: '9999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      backgroundColor: status === 'Advance Fare' ? 'var(--primary)' : status === 'To Pay (Paid)' ? 'var(--success)' : 'var(--warning)',
      color: 'white',
    }),
    empty: { textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
  };

  // ── Full-page Invoice View ──
  if (selectedInvoice) {
    const inv = selectedInvoice;
    const chargeRows = [
      { label: 'Container Charges', key: 'containerCharges' },
      { label: 'Karachi Local Charges', key: 'karachiLocalCharges' },
      { label: 'Lahore Local Charges', key: 'lahoreLocalCharges' },
      { label: 'Labor Charges', key: 'laborCharges' },
      { label: 'Godown Charges', key: 'godownCharges' },
      { label: 'Other Charges', key: 'otherCharges' },
    ];

    return (
      <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: 'var(--text-main)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <button
            onClick={handleCloseInvoice}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Back to Invoices
          </button>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} /> Invoice — Bilty #{inv.bilties?.bilty_no ?? inv.bilty_id}
          </h2>
        </div>

        {/* Delivery Details Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Delivery Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 2rem' }}>
            {[
              ['Bilty Number', `#${inv.bilties?.bilty_no ?? inv.bilty_id}`],
              ['Delivery Date', inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString() : '—'],
              ['Sender', inv.bilties?.sender_name || '—'],
              ['Sender Phone', inv.bilties?.sender_phone || '—'],
              ['Receiver Name', inv.receiver_name || '—'],
              ['Receiver Mobile', inv.receiver_phone || '—'],
              ['Receiver CNIC', inv.receiver_cnic || '—'],
              ['Quantity Delivered', inv.delivered_quantity],
              ['From', inv.bilties?.from_city || '—'],
              ['To', inv.bilties?.to_city || '—'],
              ['Payment Status', null],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
                {label === 'Payment Status' ? (
                  <span style={styles.badge(inv.bilties?.payment_status)}>{inv.bilties?.payment_status || '—'}</span>
                ) : (
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Freight & Additional Charges Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Freight & Additional Charges</h3>

          {/* Freight (readonly) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', marginBottom: '0.5rem', background: 'var(--primary-light)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Freight (Base Cost)</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>Rs {freight.toLocaleString()}</span>
          </div>

          {/* Additional Charge Rows */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Description</th>
                <th style={{ padding: '0.6rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', borderBottom: '2px solid var(--border)', width: '220px' }}>Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {chargeRows.map(({ label, key }) => (
                <tr key={key}>
                  <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}>{label}</td>
                  <td style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={charges[key]}
                      onChange={(e) => setCharges(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ width: '160px', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right', background: 'var(--background)', color: 'var(--text-main)', outline: 'none' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Calculations</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Gross Without Tax */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gross Amount Without Tax</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Rs {grossWithoutTax.toLocaleString()}</span>
            </div>

            {/* Tax % input */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tax (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                style={{ width: '100px', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right', background: 'var(--background)', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>

            {/* Tax Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tax Amount</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning)' }}>Rs {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            {/* Total Amount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', marginTop: '0.25rem', background: 'var(--primary)', borderRadius: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>Total Amount</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>Rs {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Invoices List ──
  return (
    <div style={styles.root}>
      <h1 style={styles.title}><FileText size={26} color="var(--primary)" /> Invoices</h1>
      <p style={styles.subtitle}>All confirmed deliveries — auto-populated from Delivery confirmations.</p>

      <div style={styles.card}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: '#64748b' }}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div style={styles.empty}>No invoices yet. Confirm a delivery to see it here.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Bilty No.</th>
                  <th style={styles.th}>Delivery Date</th>
                  <th style={styles.th}>Receiver</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Qty Delivered</th>
                  <th style={styles.th}>Freight</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={inv.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ transition: 'background 0.15s' }}>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: 'var(--primary)' }}>
                      #{inv.bilties?.bilty_no ?? inv.bilty_id}
                    </td>
                    <td style={styles.td}>
                      {inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={styles.td}>{inv.receiver_name}</td>
                    <td style={styles.td}>{inv.receiver_phone}</td>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{inv.delivered_quantity}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: 'var(--success)' }}>
                      Rs {Number(inv.bilties?.total_amount || 0).toLocaleString()}
                    </td>
                    <td style={styles.td}>
                      {inv.bilties?.payment_status && (
                        <span style={styles.badge(inv.bilties.payment_status)}>
                          {inv.bilties.payment_status}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                    <button style={styles.viewBtn} onClick={() => handleOpenInvoice(inv)}>
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
